import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn().mockResolvedValue({});

vi.mock("@aws-sdk/client-s3", () => {
  class MockS3Client {
    send = send;
  }
  return {
    S3Client: MockS3Client,
    PutObjectCommand: class {
      input: unknown;
      constructor(input: unknown) {
        this.input = input;
      }
    },
    DeleteObjectCommand: class {
      input: unknown;
      constructor(input: unknown) {
        this.input = input;
      }
    },
  };
});

const S3_ENV_KEYS = [
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_PUBLIC_BASE_URL",
  "STORAGE_DRIVER",
  "VERCEL",
  "MAJETIO_EPHEMERAL_FS",
  "AWS_LAMBDA_FUNCTION_NAME",
] as const;

function clearStorageEnv() {
  for (const key of S3_ENV_KEYS) {
    delete process.env[key];
  }
}

beforeEach(() => {
  clearStorageEnv();
  send.mockClear();
  send.mockResolvedValue({});
});

afterEach(() => {
  clearStorageEnv();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("listing-media-storage", () => {
  it("resolves without credentials at import time", async () => {
    const mod = await import("@/lib/storage/listing-media-storage");
    expect(mod.resolveStorageDriver()).toBe("local");
    expect(mod.hasS3Config()).toBe(false);
  });

  it("fail-closes on ephemeral host without S3 — no silent local fallback", async () => {
    process.env.VERCEL = "1";
    const { putListingObject, resolveStorageDriver } = await import(
      "@/lib/storage/listing-media-storage"
    );
    expect(resolveStorageDriver()).toBe("unavailable");

    const result = await putListingObject({
      bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      fileName: "x.png",
      contentType: "image/png",
      keyPrefix: "listings/test",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("storage_unavailable");
      expect(result.error).toMatch(/Trvalé úložiště|S3_/i);
    }
    expect(send).not.toHaveBeenCalled();
  });

  it("STORAGE_DRIVER=local on production ephemeral host is unavailable", async () => {
    process.env.VERCEL = "1";
    vi.stubEnv("NODE_ENV", "production");
    process.env.STORAGE_DRIVER = "local";
    const { resolveStorageDriver } = await import("@/lib/storage/listing-media-storage");
    expect(resolveStorageDriver()).toBe("unavailable");
  });

  it("uses S3 adapter via mocked SDK when configured", async () => {
    process.env.S3_BUCKET = "test-bucket";
    process.env.S3_ACCESS_KEY_ID = "AKIAXXXXXXXXXXXXXXXX";
    process.env.S3_SECRET_ACCESS_KEY = "secret-not-for-logs";
    process.env.S3_REGION = "eu-central-1";
    process.env.STORAGE_DRIVER = "s3";

    const { putListingObject, resolveStorageDriver, storageConfigStatus } = await import(
      "@/lib/storage/listing-media-storage"
    );
    expect(resolveStorageDriver()).toBe("s3");

    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52,
    ]);
    const result = await putListingObject({
      bytes: png,
      fileName: "photo.png",
      contentType: "image/png",
      keyPrefix: "listings/abc",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.object.driver).toBe("s3");
      expect(result.object.url).toContain("test-bucket");
    }
    expect(send).toHaveBeenCalledOnce();

    const statusBlob = JSON.stringify(storageConfigStatus());
    expect(statusBlob).not.toContain("secret-not-for-logs");
    expect(statusBlob).not.toMatch(/AKIA[0-9A-Z]{16}/);
  });
});
