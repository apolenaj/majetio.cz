import { auth } from "@/lib/auth";
import { hasMinRole, isAdmin, type Role } from "@/lib/auth/roles";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user?.id) {
    throw new AuthError("Přihlášení je povinné.");
  }
  return user;
}

export async function requireRole(...allowed: Role[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role) && !isAdmin(user.role)) {
    throw new AuthError("Nemáte oprávnění k této akci.");
  }
  return user;
}

export async function requireMinRole(minimum: Role) {
  const user = await requireUser();
  if (!hasMinRole(user.role, minimum) && !isAdmin(user.role)) {
    throw new AuthError("Nemáte oprávnění k této akci.");
  }
  return user;
}
