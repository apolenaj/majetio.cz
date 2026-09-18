/**
 * Listing media storage — adapters for durable object storage vs local disk.
 *
 * On Vercel/serverless the filesystem is ephemeral: local uploads MUST NOT be
 * the only persistence path for customer photos. Prefer S3-compatible storage
 * when BLOB/S3 env is configured.
 */

import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

import { assertSafeUploadMeta } from "@/lib/security/upload-mime";

export type StoredObject = {
  /** Public or app-served URL stored on PropertyMedia.url */
  url: string;
  /** Opaque key for delete / ACL (storage path or object key). */
  storageKey: string;
  driver: "local" | "s3";
};

export type PutObjectInput = {
  bytes: Buffer;
  fileName: string;
  contentType: string;
  /** Logical prefix, e.g. listings/{propertyId} */
  keyPrefix: string;
};

function isEphemeralHost(): boolean {
  return (
    process.env.VERCEL === "1" ||
    process.env.AWS_LAMBDA_FUNCTION_NAME != null ||
    process.env.MAJETIO_EPHEMERAL_FS === "true"
  );
}

/**
 * Resolve active driver.
 * - s3 when S3_BUCKET + credentials present
 * - local only when not ephemeral (or STORAGE_DRIVER=local explicitly in non-prod)
 */
export function resolveStorageDriver(): "local" | "s3" | "unavailable" {
  const forced = (process.env.STORAGE_DRIVER || "").toLowerCase();
  if (forced === "s3" || hasS3Config()) {
    if (!hasS3Config()) return "unavailable";
    return "s3";
  }
  if (forced === "local") {
    if (isEphemeralHost() && process.env.NODE_ENV === "production") {
      return "unavailable";
    }
    return "local";
  }
  if (isEphemeralHost()) {
    return hasS3Config() ? "s3" : "unavailable";
  }
  return "local";
}

export function hasS3Config(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      (process.env.S3_ENDPOINT || process.env.S3_REGION),
  );
}

export function storageConfigStatus(): {
  driver: ReturnType<typeof resolveStorageDriver>;
  ephemeralHost: boolean;
  missingEnv: string[];
} {
  const ephemeralHost = isEphemeralHost();
  const missingEnv: string[] = [];
  if (!hasS3Config()) {
    for (const key of [
      "S3_BUCKET",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
      "S3_ENDPOINT|S3_REGION",
    ] as const) {
      if (key.includes("|")) {
        if (!process.env.S3_ENDPOINT && !process.env.S3_REGION) {
          missingEnv.push("S3_ENDPOINT or S3_REGION");
        }
      } else if (!process.env[key]) {
        missingEnv.push(key);
      }
    }
  }
  return {
    driver: resolveStorageDriver(),
    ephemeralHost,
    missingEnv: hasS3Config() ? [] : missingEnv,
  };
}

function extForMime(mime: string): string {
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".jpg";
}

async function putLocal(input: PutObjectInput & { mime: string }): Promise<StoredObject> {
  const ext = extForMime(input.mime);
  const fileBase = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  const relativeDir = path.join("uploads", ...input.keyPrefix.split("/").filter(Boolean));
  const absDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absDir, { recursive: true });
  const abs = path.join(absDir, fileBase);
  await writeFile(abs, input.bytes);
  const urlPath = `/${relativeDir.replace(/\\/g, "/")}/${fileBase}`;
  return {
    url: urlPath,
    storageKey: urlPath,
    driver: "local",
  };
}

async function loadS3Client(): Promise<
  | {
      S3Client: typeof import("@aws-sdk/client-s3").S3Client;
      PutObjectCommand: typeof import("@aws-sdk/client-s3").PutObjectCommand;
      DeleteObjectCommand: typeof import("@aws-sdk/client-s3").DeleteObjectCommand;
    }
  | null
> {
  try {
    // Avoid Vite/Vitest static resolution when the optional SDK is not installed.
    const spec = "@aws-sdk/" + "client-s3";
    const mod = (await import(spec)) as typeof import("@aws-sdk/client-s3");
    return {
      S3Client: mod.S3Client,
      PutObjectCommand: mod.PutObjectCommand,
      DeleteObjectCommand: mod.DeleteObjectCommand,
    };
  } catch {
    return null;
  }
}

async function putS3(input: PutObjectInput & { mime: string }): Promise<StoredObject> {
  const bucket = process.env.S3_BUCKET!;
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, "");
  const region = process.env.S3_REGION || "auto";
  const publicBase =
    process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    (endpoint ? `${endpoint}/${bucket}` : `https://${bucket}.s3.${region}.amazonaws.com`);

  const ext = extForMime(input.mime);
  const objectKey = `${input.keyPrefix.replace(/^\/+|\/+$/g, "")}/${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;

  const sdk = await loadS3Client();
  if (!sdk) {
    throw new Error(
      "S3 úložiště je nakonfigurované, ale chybí balíček @aws-sdk/client-s3. Nainstalujte jej nebo použijte STORAGE_DRIVER=local mimo ephemeral host.",
    );
  }

  const client = new sdk.S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });

  await client.send(
    new sdk.PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: input.bytes,
      ContentType: input.mime,
      ACL: process.env.S3_OBJECT_ACL === "private" ? "private" : "public-read",
    }),
  );

  const url = `${publicBase}/${objectKey}`;
  return { url, storageKey: objectKey, driver: "s3" };
}

export async function putListingObject(
  input: PutObjectInput,
): Promise<
  | { ok: true; object: StoredObject }
  | { ok: false; error: string; code: "validation" | "storage_unavailable" | "storage_failed" }
> {
  const mimeCheck = assertSafeUploadMeta({
    contentType: input.contentType,
    fileName: input.fileName,
    sizeBytes: input.bytes.byteLength,
  });
  if (!mimeCheck.ok) {
    return {
      ok: false,
      code: "validation",
      error:
        mimeCheck.reason === "too_large"
          ? "Soubor je příliš velký (max. 10 MB)."
          : "Nepovolený typ souboru. Povoleny: JPG, PNG, WebP, GIF.",
    };
  }
  if (!mimeCheck.mime.startsWith("image/")) {
    return {
      ok: false,
      code: "validation",
      error: "K nabídce lze nahrát pouze obrázky.",
    };
  }

  const driver = resolveStorageDriver();
  if (driver === "unavailable") {
    const status = storageConfigStatus();
    return {
      ok: false,
      code: "storage_unavailable",
      error: `Trvalé úložiště fotografií není nakonfigurované (ephemeral FS / chybí: ${status.missingEnv.join(", ") || "S3_*"}). Lokální /uploads nestačí na Vercel.`,
    };
  }

  try {
    const object =
      driver === "s3"
        ? await putS3({ ...input, mime: mimeCheck.mime })
        : await putLocal({ ...input, mime: mimeCheck.mime });
    return { ok: true, object };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload selhal.";
    return { ok: false, code: "storage_failed", error: message };
  }
}

export async function deleteListingObject(storageKey: string): Promise<void> {
  if (!storageKey) return;
  const driver = resolveStorageDriver();
  if (driver === "local" && storageKey.startsWith("/uploads/")) {
    const abs = path.join(process.cwd(), "public", storageKey.replace(/^\//, ""));
    try {
      await unlink(abs);
    } catch {
      // already gone
    }
    return;
  }
  if (driver === "s3" && hasS3Config()) {
    try {
      const sdk = await loadS3Client();
      if (!sdk) return;
      const client = new sdk.S3Client({
        region: process.env.S3_REGION || "auto",
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
      });
      await client.send(
        new sdk.DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: storageKey,
        }),
      );
    } catch {
      // best-effort delete
    }
  }
}
