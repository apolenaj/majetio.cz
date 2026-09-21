"use server";

import { createHash, randomBytes } from "node:crypto";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { writeAuditLog, getRequestIp } from "@/lib/auth/audit";
import { getSafeCallbackUrl } from "@/lib/auth/callback-url";
import { AUTH_MESSAGES, CURRENT_CONSENT_VERSIONS, rateLimitedMessage } from "@/lib/auth/constants";
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

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

function isAuthSignInFailureUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value, "http://localhost");
    return (
      url.pathname.includes("/api/auth/error") ||
      url.searchParams.has("error") ||
      url.searchParams.get("error") != null
    );
  } catch {
    return /(?:[?&]error=|\/api\/auth\/error)/i.test(value);
  }
}

function mapRegisterException(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  ) {
    return AUTH_MESSAGES.emailTaken;
  }
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: string }).code === "string" &&
    (error as { code: string }).code.startsWith("P")
  ) {
    console.error("[auth.register] prisma", (error as { code: string }).code);
    return AUTH_MESSAGES.registerFailed;
  }
  console.error(
    "[auth.register] unexpected",
    error instanceof Error ? error.name : typeof error,
  );
  return AUTH_MESSAGES.registerFailed;
}

const registerSchema = z.object({
  email: z.string().trim().email().max(254),
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
    const issue = parsed.error.issues[0];
    if (issue?.path[0] === "email") {
      return { ok: false, error: "Zkontrolujte zadaný e-mail." };
    }
    if (issue?.path[0] === "password") {
      return { ok: false, error: AUTH_MESSAGES.weakPassword };
    }
    if (issue?.path[0] === "acceptTerms") {
      return { ok: false, error: AUTH_MESSAGES.consentRequired };
    }
    return { ok: false, error: "Zkontrolujte zadaný e-mail a heslo." };
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
    return { ok: false, error: rateLimitedMessage(limited.retryAfterSec) };
  }

  try {
    const { detectFreeAccountVelocity, isBlockedByAbuse } = await import(
      "@/domains/fraud",
    );
    const abuse = await detectFreeAccountVelocity({ ip, email });
    if (isBlockedByAbuse(abuse.signals)) {
      await recordAuthFailure([ip, "register", email]);
      const { writeMonetizationAuditLog } = await import(
        "@/domains/revenue/monetization-audit",
      );
      await writeMonetizationAuditLog({
        action: "fraud.signal.blocked",
        entity: "UserRegistration",
        ip,
        meta: {
          codes: abuse.signals.map((s) => s.code),
          severities: abuse.signals.map((s) => s.severity),
        },
      });
      return { ok: false, error: AUTH_MESSAGES.registerFailed };
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
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
    const { getPublicAppUrl } = await import("@/lib/app-url");
    const base = getPublicAppUrl();
    logEmailInDev(welcomeEmail(`${base}/onboarding`), "new-user");

    let signedIn = false;
    try {
      // Auth.js v5 with redirect:false returns a URL string (not { error }).
      const signInResult = await signIn("credentials", {
        email,
        password: parsed.data.password,
        redirect: false,
      });
      if (isAuthSignInFailureUrl(signInResult)) {
        signedIn = false;
      } else {
        signedIn = true;
      }
    } catch (error) {
      if (error instanceof AuthError) {
        signedIn = false;
      } else {
        // Propagate Next.js redirect / router interrupts; ignore other sign-in noise.
        const { unstable_rethrow } = await import("next/navigation");
        unstable_rethrow(error);
        signedIn = false;
      }
    }

    try {
      const { linkUnclaimedMortgageLeadsOnAuth } = await import(
        "@/domains/leads/service/lead-linking"
      );
      await linkUnclaimedMortgageLeadsOnAuth({
        userId: user.id,
        verifiedEmail: email,
        authMethod: "register",
      });
    } catch (linkError) {
      console.error(
        "[auth.register] lead link failed",
        linkError instanceof Error ? linkError.name : "unknown",
      );
    }

    if (!signedIn) {
      // Account exists — do not leave the user stuck with a generic failure.
      return {
        ok: true,
        message: "Účet byl vytvořen. Přihlaste se prosím e-mailem a heslem.",
      };
    }

    redirect(getSafeCallbackUrl(parsed.data.callbackUrl, "/onboarding"));
  } catch (error) {
    const { unstable_rethrow } = await import("next/navigation");
    unstable_rethrow(error);
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    await recordAuthFailure([ip, "register", email]).catch(() => undefined);
    return { ok: false, error: mapRegisterException(error) };
  }
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
    // Auth.js v5 with redirect:false returns a URL string (not { error }).
    const result = await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
    });
    if (isAuthSignInFailureUrl(result)) {
      return { ok: false, error: AUTH_MESSAGES.invalidCredentials };
    }
  } catch (error) {
    const { unstable_rethrow } = await import("next/navigation");
    unstable_rethrow(error);
    if (error instanceof AuthError) {
      return { ok: false, error: AUTH_MESSAGES.invalidCredentials };
    }
    throw error;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (dbUser) {
    const { linkUnclaimedMortgageLeadsOnAuth } = await import(
      "@/domains/leads/service/lead-linking"
    );
    await linkUnclaimedMortgageLeadsOnAuth({
      userId: dbUser.id,
      verifiedEmail: email,
      authMethod: "login",
    });
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
    return { ok: false, error: rateLimitedMessage(limited.retryAfterSec) };
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

    const { getPublicAppUrl } = await import("@/lib/app-url");
    const base = getPublicAppUrl();
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
    return { ok: false, error: rateLimitedMessage(limited.retryAfterSec) };
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
    prisma.session.deleteMany({ where: { userId: user.id } }),
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
