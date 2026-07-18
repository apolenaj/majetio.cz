import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { writeAuditLog, getRequestIp } from "@/lib/auth/audit";
import {
  assertNotRateLimited,
  clearAuthFailures,
  recordAuthFailure,
} from "@/lib/auth/rate-limit";
import { verifyPassword } from "@/lib/auth/password";
import type { Role } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

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
                  meta: { reason: "rate_limited", email },
                });
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
                },
              });

              if (!user?.passwordHash) {
                await recordAuthFailure(rateKey);
                await writeAuditLog({
                  action: "auth.login.failure",
                  entity: "User",
                  meta: { reason: "unknown_user", email },
                });
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
                return null;
              }

              await clearAuthFailures(rateKey);
              await writeAuditLog({
                action: "auth.login.success",
                entity: "User",
                entityId: user.id,
                actorId: user.id,
              });

              // Never return passwordHash to Auth.js
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                role: user.role,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        // Role always from DB — never from client payload
        token.role = dbUser?.role ?? "USER";
      }
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
