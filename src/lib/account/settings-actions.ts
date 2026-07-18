"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";

import { writeAuditLog, getRequestIp } from "@/lib/auth/audit";
import { auth, signOut } from "@/lib/auth";
import {
  hashPassword,
  isPasswordStrongEnough,
  verifyPassword,
} from "@/lib/auth/password";
import {
  assertNotRateLimited,
  recordAuthFailure,
  clearAuthFailures,
} from "@/lib/auth/rate-limit";
import { track } from "@/lib/analytics/events";
import {
  emailChangeConfirmEmail,
  logEmailInDev,
} from "@/lib/email/templates";
import { prisma } from "@/lib/db";
import { ACCOUNT_DELETE_CONSEQUENCES } from "@/lib/privacy/constants";

export type SettingsActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export type SettingsPageData = {
  email: string;
  pendingEmail: string | null;
  name: string;
  phone: string | null;
  consequences: readonly string[];
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function requireSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function loadSettingsPage(): Promise<
  { ok: true; data: SettingsPageData } | { ok: false; error: string }
> {
  const sessionUser = await requireSessionUser();
  if (!sessionUser?.id) return { ok: false, error: "Přihlášení je povinné." };

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { profile: true },
  });
  if (!user) return { ok: false, error: "Účet nenalezen." };

  return {
    ok: true,
    data: {
      email: user.email,
      pendingEmail: user.pendingEmail,
      name: user.name ?? "",
      phone: user.profile?.phone ?? null,
      consequences: ACCOUNT_DELETE_CONSEQUENCES,
    },
  };
}

export async function updateDisplayName(
  name: string,
): Promise<SettingsActionResult> {
  const sessionUser = await requireSessionUser();
  if (!sessionUser?.id) return { ok: false, error: "Přihlášení je povinné." };

  const parsed = z.string().trim().max(80).safeParse(name);
  if (!parsed.success) return { ok: false, error: "Jméno je příliš dlouhé." };

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { name: parsed.data || null },
  });

  await writeAuditLog({
    action: "account.profile.update",
    entity: "User",
    entityId: sessionUser.id,
    actorId: sessionUser.id,
    meta: { fields: ["name"] },
  });

  return { ok: true, message: "Jméno bylo uloženo." };
}

export async function updatePhone(phone: string): Promise<SettingsActionResult> {
  const sessionUser = await requireSessionUser();
  if (!sessionUser?.id) return { ok: false, error: "Přihlášení je povinné." };

  const parsed = z.string().trim().max(32).safeParse(phone);
  if (!parsed.success) return { ok: false, error: "Telefon není platný." };

  await prisma.userProfile.upsert({
    where: { userId: sessionUser.id },
    create: {
      userId: sessionUser.id,
      preferredLocale: "cs",
      phone: parsed.data || null,
    },
    update: { phone: parsed.data || null },
  });

  return { ok: true, message: "Telefon byl uložen." };
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<SettingsActionResult> {
  const sessionUser = await requireSessionUser();
  if (!sessionUser?.id) return { ok: false, error: "Přihlášení je povinné." };

  const ip = await getRequestIp();
  const limited = await assertNotRateLimited([ip, "password-change", sessionUser.id]);
  if (!limited.ok) {
    return { ok: false, error: "Příliš mnoho pokusů. Zkuste to později." };
  }

  if (!isPasswordStrongEnough(input.newPassword)) {
    return {
      ok: false,
      error: "Nové heslo musí mít alespoň 8 znaků, písmeno a číslici.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    return { ok: false, error: "Účet nemá nastavené heslo." };
  }

  const valid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!valid) {
    await recordAuthFailure([ip, "password-change", sessionUser.id]);
    return { ok: false, error: "Současné heslo není správné." };
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { passwordHash },
  });
  await clearAuthFailures([ip, "password-change", sessionUser.id]);
  await writeAuditLog({
    action: "auth.password_change",
    entity: "User",
    entityId: sessionUser.id,
    actorId: sessionUser.id,
  });

  track({ name: "password_changed", props: {} });
  return { ok: true, message: "Heslo bylo změněno." };
}

export async function requestEmailChange(input: {
  newEmail: string;
  password: string;
}): Promise<SettingsActionResult> {
  const sessionUser = await requireSessionUser();
  if (!sessionUser?.id) return { ok: false, error: "Přihlášení je povinné." };

  const emailResult = z.string().email().max(254).safeParse(input.newEmail.trim().toLowerCase());
  if (!emailResult.success) return { ok: false, error: "Nový e-mail není platný." };

  const ip = await getRequestIp();
  const limited = await assertNotRateLimited([ip, "email-change", sessionUser.id]);
  if (!limited.ok) {
    return { ok: false, error: "Příliš mnoho pokusů. Zkuste to později." };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { email: true, passwordHash: true },
  });
  if (!user?.passwordHash) return { ok: false, error: "Účet nemá nastavené heslo." };

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    await recordAuthFailure([ip, "email-change", sessionUser.id]);
    return { ok: false, error: "Heslo není správné." };
  }

  const newEmail = emailResult.data;
  if (newEmail === user.email) {
    return { ok: false, error: "Nový e-mail je stejný jako současný." };
  }

  const taken = await prisma.user.findUnique({
    where: { email: newEmail },
    select: { id: true },
  });
  if (taken) return { ok: false, error: "Tento e-mail už používá jiný účet." };

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  const identifier = `email-change:${sessionUser.id}`;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: sessionUser.id },
      data: { pendingEmail: newEmail },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: { identifier, token: tokenHash, expires },
    }),
  ]);

  const base = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  const confirmUrl = `${base}/overeni-emailu?token=${rawToken}&uid=${sessionUser.id}`;

  if (process.env.NODE_ENV !== "production") {
    console.info("[auth] email change confirm URL:", confirmUrl);
  }
  logEmailInDev(emailChangeConfirmEmail(confirmUrl), "email-change");

  await writeAuditLog({
    action: "account.email_change.request",
    entity: "User",
    entityId: sessionUser.id,
    actorId: sessionUser.id,
    meta: { pendingEmailFp: sha256(newEmail).slice(0, 16) },
  });

  track({ name: "email_change_requested", props: {} });

  return {
    ok: true,
    message:
      "Poslali jsme odkaz pro potvrzení nového e-mailu. (V developmentu je odkaz v logu serveru.)",
  };
}

export async function confirmEmailChange(input: {
  userId: string;
  token: string;
}): Promise<SettingsActionResult> {
  const tokenHash = sha256(input.token);
  const identifier = `email-change:${input.userId}`;
  const record = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: { identifier, token: tokenHash },
    },
  });

  if (!record || record.expires < new Date()) {
    return { ok: false, error: "Odkaz pro změnu e-mailu je neplatný nebo vypršel." };
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { pendingEmail: true },
  });
  if (!user?.pendingEmail) {
    return { ok: false, error: "Žádná čekající změna e-mailu." };
  }

  const taken = await prisma.user.findUnique({
    where: { email: user.pendingEmail },
    select: { id: true },
  });
  if (taken && taken.id !== input.userId) {
    return { ok: false, error: "E-mail už není k dispozici." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: input.userId },
      data: {
        email: user.pendingEmail,
        pendingEmail: null,
        emailVerified: new Date(),
      },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token: tokenHash } },
    }),
  ]);

  await writeAuditLog({
    action: "account.email_change.success",
    entity: "User",
    entityId: input.userId,
    actorId: input.userId,
  });

  return { ok: true, message: "E-mail byl změněn. Přihlaste se znovu novým e-mailem." };
}

export async function deleteAccount(input: {
  password: string;
  confirmEmail: string;
}): Promise<SettingsActionResult> {
  const sessionUser = await requireSessionUser();
  if (!sessionUser?.id) return { ok: false, error: "Přihlášení je povinné." };

  const ip = await getRequestIp();
  const limited = await assertNotRateLimited([ip, "account-delete", sessionUser.id]);
  if (!limited.ok) {
    return { ok: false, error: "Příliš mnoho pokusů. Zkuste to později." };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { email: true, passwordHash: true },
  });
  if (!user?.passwordHash) return { ok: false, error: "Účet nelze smazat." };

  if (input.confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return {
      ok: false,
      error: "Pro potvrzení zadejte přesně svůj současný e-mail.",
    };
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    await recordAuthFailure([ip, "account-delete", sessionUser.id]);
    return { ok: false, error: "Heslo není správné." };
  }

  await writeAuditLog({
    action: "account.delete",
    entity: "User",
    entityId: sessionUser.id,
    actorId: sessionUser.id,
    meta: { emailHash: sha256(user.email) },
  });

  track({ name: "account_delete_requested", props: {} });

  await prisma.user.delete({ where: { id: sessionUser.id } });
  await signOut({ redirect: false });
  redirect("/?deleted=1");
}
