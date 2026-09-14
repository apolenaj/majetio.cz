import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { writeAuditLog, getRequestIp } from "@/lib/auth/audit";
import { track } from "@/lib/analytics/events";
import {
  assertNotRateLimited,
  clearAuthFailures,
  recordAuthFailure,
} from "@/lib/auth/rate-limit";
import { verifyPassword } from "@/lib/auth/password";
import type { Role } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { createHash } from "node:crypto";

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

function emailFingerprint(email: string): string {
  return createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 16);
}

/**
 * Bound into JWT so password change / reset invalidates existing sessions
 * without a schema migration (hash changes → fingerprint mismatch → revoke).
 */
function credentialsFingerprint(passwordHash: string | null | undefined): string {
  if (!passwordHash) return "nopw";
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

function credentialsEnabled(): boolean {
  return process.env.AUTH_CREDENTIALS_ENABLED !== "false";
}

/**
 * Auth.js (NextAuth v5) — JWT sessions, Prisma adapter for OAuth/account linkage.
 * Role is always loaded from DB — never accepted from the client.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 14, // 14 days
  },
  pages: {
    signIn: "/prihlaseni",
  },
  // Auth.js sets HttpOnly + SameSite cookies; Secure is automatic on HTTPS in production.
  providers: [
    ...(credentialsEnabled()
      ? [
          Credentials({
            id: "credentials",
            name: "credentials",
            credentials: {
              email: { label: "E-mail", type: "email" },
              password: { label: "Heslo", type: "password" },
            },
            authorize: async (raw) => {
              const parsed = credentialsSchema.safeParse(raw);
              if (!parsed.success) return null;

              const email = parsed.data.email.toLowerCase().trim();
              const ip = await getRequestIp();
              const rateKey = [ip, email];

              const limited = await assertNotRateLimited(rateKey);
              if (!limited.ok) {
                await writeAuditLog({
                  action: "auth.login.failure",
                  entity: "User",
                  meta: { reason: "rate_limited", emailFp: emailFingerprint(email) },
                });
                track({ name: "login_failed", props: { reason: "rate_limit" } });
                return null;
              }

              const user = await prisma.user.findUnique({
                where: { email },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  image: true,
                  passwordHash: true,
                  role: true,
                  accountStatus: true,
                },
              });

              if (!user?.passwordHash) {
                await recordAuthFailure(rateKey);
                await writeAuditLog({
                  action: "auth.login.failure",
                  entity: "User",
                  meta: { reason: "unknown_user", emailFp: emailFingerprint(email) },
                });
                track({ name: "login_failed", props: { reason: "credentials" } });
                return null;
              }

              const valid = await verifyPassword(parsed.data.password, user.passwordHash);
              if (!valid) {
                await recordAuthFailure(rateKey);
                await writeAuditLog({
                  action: "auth.login.failure",
                  entity: "User",
                  entityId: user.id,
                  actorId: user.id,
                  meta: { reason: "bad_password" },
                });
                track({ name: "login_failed", props: { reason: "credentials" } });
                return null;
              }

              const status = user.accountStatus ?? "ACTIVE";
              if (status === "SUSPENDED" || status === "DELETION_REQUESTED") {
                await writeAuditLog({
                  action: "auth.login.failure",
                  entity: "User",
                  entityId: user.id,
                  actorId: user.id,
                  meta: { reason: "account_status", accountStatus: status },
                });
                track({
                  name: "login_failed",
                  props: { reason: "account_status" },
                });
                return null;
              }

              await clearAuthFailures(rateKey);
              await writeAuditLog({
                action: "auth.login.success",
                entity: "User",
                entityId: user.id,
                actorId: user.id,
              });
              track({ name: "login_succeeded", props: {} });

              // Never return passwordHash to Auth.js
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                role: user.role,
                // Stashed for jwt callback on first issue (Auth.js copies onto user)
                credentialsFp: credentialsFingerprint(user.passwordHash),
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      const userId = user?.id ?? token.sub;
      if (!userId) return token;

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, accountStatus: true, passwordHash: true },
      });
      // Role always from DB — never from client payload
      if (
        !dbUser ||
        dbUser.accountStatus === "SUSPENDED" ||
        dbUser.accountStatus === "DELETION_REQUESTED"
      ) {
        return { ...token, sub: undefined, role: undefined, cfp: undefined };
      }

      const liveFp = credentialsFingerprint(dbUser.passwordHash);
      if (user) {
        // Fresh sign-in — bind credentials fingerprint into JWT
        const fromUser =
          typeof (user as { credentialsFp?: string }).credentialsFp === "string"
            ? (user as { credentialsFp: string }).credentialsFp
            : liveFp;
        token.cfp = fromUser;
      } else if (token.cfp && token.cfp !== liveFp) {
        // Password changed/reset elsewhere — revoke this JWT session
        return { ...token, sub: undefined, role: undefined, cfp: undefined };
      } else if (!token.cfp) {
        // Legacy JWT without fingerprint — bind once (next password change revokes)
        token.cfp = liveFp;
      }

      token.sub = userId;
      token.role = dbUser.role ?? "USER";
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role) ?? "USER";
      }
      return session;
    },
  },
  trustHost: true,
});
