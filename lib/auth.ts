import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import type { SessionUser } from "@/types";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set("session_id", session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      expiresAt: { gt: new Date() },
    },
    include: { user: { select: { id: true, username: true, role: true } } },
  });

  if (!session) return null;
  return {
    id: session.user.id,
    username: session.user.username,
    role: session.user.role,
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => null);
  }
  cookieStore.delete("session_id");
}

export async function validateCredentials(
  username: string,
  password: string
): Promise<{ id: string; username: string; role: string } | null> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? { id: user.id, username: user.username, role: user.role } : null;
}
