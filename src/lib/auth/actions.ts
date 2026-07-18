"use server";

import { createHash, randomBytes } from "node:crypto";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { writeAuditLog, getRequestIp } from "@/lib/auth/audit";
import { getSafeCallbackUrl } from "@/lib/auth/callback-url";
import { AUTH_MESSAGES, CURRENT_CONSENT_VERSIONS } from "@/lib/auth/constants";
import { signIn, signOut } from "@/lib/auth";
import {
  hashPassword,
  isPasswordStrongEnough,
} from "@/lib/auth/password";
import {
  assertNotRateLimited,
  clearAuthFailures,
  recordAuthFailure,
} from "@/lib/auth/rate-limit";
import { track } from "@/lib/analytics/events";
import { logEmailInDev, passwordResetEmail, welcomeEmail } from "@/lib/email/templates";
import { prisma } from "@/lib/db";
import { ConsentType, Role } from "@prisma/client";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  acceptTerms: z.literal("on").or(z.literal("true")).or(z.literal("1")),
  callbackUrl: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  callbackUrl: z.string().optional(),
});

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    acceptTerms: formData.get("acceptTerms"),
    callbackUrl: formData.get("callbackUrl") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: AUTH_MESSAGES.genericError };
  }

  if (formData.get("acceptTerms") == null) {
    return { ok: false, error: AUTH_MESSAGES.consentRequired };
  }

  if (!isPasswordStrongEnough(parsed.data.password)) {
    return { ok: false, error: AUTH_MESSAGES.weakPassword };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const ip = await getRequestIp();
  const limited = await assertNotRateLimited([ip, "register", email]);
  if (!limited.ok) {
    return { ok: false, error: AUTH_MESSAGES.rateLimited };
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    await recordAuthFailure([ip, "register", email]);
    return { ok: false, error: AUTH_MESSAGES.emailTaken };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  // Role is ALWAYS USER at registration — never taken from the client.
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: Role.USER,
        profile: { create: { preferredLocale: "cs" } },
      },
      select: { id: true, email: true },
    });

    const now = new Date();
    await tx.consent.createMany({
      data: [
        {
          userId: created.id,
          type: ConsentType.TERMS,
          granted: true,
          version: CURRENT_CONSENT_VERSIONS.TERMS,
          grantedAt: now,
        },
        {
          userId: created.id,
          type: ConsentType.PRIVACY,
          granted: true,
          version: CURRENT_CONSENT_VERSIONS.PRIVACY,
          grantedAt: now,
        },
      ],
    });

    return created;
  });

  await writeAuditLog({
    action: "auth.register",
    entity: "User",
    entityId: user.id,
    actorId: user.id,
  });
  await writeAuditLog({
    action: "consent.grant",
    entity: "Consent",
    entityId: user.id,
    actorId: user.id,
    meta: {
      types: ["TERMS", "PRIVACY"],
      versions: CURRENT_CONSENT_VERSIONS,
    },
  });

  track({ name: "signup_completed", props: { consents: "terms_privacy" } });
  const base = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  logEmailInDev(welcomeEmail(`${base}/onboarding`), "new-user");

  try {
    const result = await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
    });
    if (result?.error) {
      return { ok: false, error: AUTH_MESSAGES.genericError };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: AUTH_MESSAGES.genericError };
    }
    throw error;
  }

  redirect(getSafeCallbackUrl(parsed.data.callbackUrl, "/onboarding"));
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: AUTH_MESSAGES.invalidCredentials };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const callbackUrl = getSafeCallbackUrl(parsed.data.callbackUrl, "/ucet");

  try {
    const result = await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
    });
    if (result?.error) {
      return { ok: false, error: AUTH_MESSAGES.invalidCredentials };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: AUTH_MESSAGES.invalidCredentials };
    }
    throw error;
  }

  redirect(callbackUrl);
}

export async function logoutAction(): Promise<void> {
  await writeAuditLog({
    action: "auth.logout",
    entity: "User",
  });
  await signOut({ redirectTo: "/" });
}

export async function requestPasswordResetAction(formData: FormData): Promise<ActionResult> {
  const emailRaw = String(formData.get("email") ?? "");
  const emailResult = z.string().email().max(254).safeParse(emailRaw);
  const ip = await getRequestIp();

  const limited = await assertNotRateLimited([ip, "reset"]);
  if (!limited.ok) {
    return { ok: false, error: AUTH_MESSAGES.rateLimited };
  }

  // Always return the same message (no account enumeration).
  if (!emailResult.success) {
    return { ok: true, message: AUTH_MESSAGES.resetSent };
  }

  const email = emailResult.data.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  await writeAuditLog({
    action: "auth.password_reset.request",
    entity: "User",
    entityId: user?.id,
    actorId: user?.id,
    meta: { requested: true },
  });

  if (user?.passwordHash) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({
      where: { identifier: `password-reset:${email}` },
    });
    await prisma.verificationToken.create({
      data: {
        identifier: `password-reset:${email}`,
        token: tokenHash,
        expires,
      },
    });

    const base = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
    const resetUrl = `${base}/obnovit-heslo?token=${rawToken}&email=${encodeURIComponent(email)}`;

    if (process.env.NODE_ENV !== "production") {
      console.info("[auth] password reset URL:", resetUrl);
    }
    logEmailInDev(passwordResetEmail(resetUrl), "password-reset");
    // Production: send via email provider — never log the raw token.
  }

  track({ name: "password_reset_requested", props: {} });
  return { ok: true, message: AUTH_MESSAGES.resetSent };
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!z.string().email().safeParse(email).success || !token) {
    return { ok: false, error: AUTH_MESSAGES.resetInvalid };
  }
  if (!isPasswordStrongEnough(password)) {
    return { ok: false, error: AUTH_MESSAGES.weakPassword };
  }

  const ip = await getRequestIp();
  const limited = await assertNotRateLimited([ip, "reset-confirm", email]);
  if (!limited.ok) {
    return { ok: false, error: AUTH_MESSAGES.rateLimited };
  }

  const tokenHash = sha256(token);
  const record = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: `password-reset:${email}`,
        token: tokenHash,
      },
    },
  });

  if (!record || record.expires < new Date()) {
    await recordAuthFailure([ip, "reset-confirm", email]);
    return { ok: false, error: AUTH_MESSAGES.resetInvalid };
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    return { ok: false, error: AUTH_MESSAGES.resetInvalid };
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: `password-reset:${email}`,
          token: tokenHash,
        },
      },
    }),
  ]);

  await clearAuthFailures([ip, "reset-confirm", email]);
  await writeAuditLog({
    action: "auth.password_reset.success",
    entity: "User",
    entityId: user.id,
    actorId: user.id,
  });

  track({ name: "password_reset_completed", props: {} });
  return { ok: true, message: AUTH_MESSAGES.resetSuccess };
}
