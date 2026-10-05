import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { queryOne, execute } from "./db";
import type { SessionUser } from "@/types";

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: string;
}

interface SessionRow {
  user_id: string;
  username: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function createSession(userId: string): Promise<void> {
  const sessionId = generateId();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  execute(
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )`
  );

  execute("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [
    sessionId,
    userId,
    expires,
  ]);

  const cookieStore = await cookies();
  cookieStore.set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expires),
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  if (!sessionId) return null;

  const row = queryOne<SessionRow>(
    `SELECT s.user_id, u.username, u.role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
    [sessionId]
  );

  if (!row) return null;
  return { id: row.user_id, username: row.username, role: row.role };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  if (sessionId) {
    execute("DELETE FROM sessions WHERE id = ?", [sessionId]);
  }
  cookieStore.delete("session_id");
}

export async function validateCredentials(
  username: string,
  password: string
): Promise<UserRow | null> {
  const user = queryOne<UserRow>(
    "SELECT id, username, password_hash, role FROM users WHERE username = ?",
    [username]
  );
  if (!user) return null;
  const valid = await verifyPassword(password, user.password_hash);
  return valid ? user : null;
}
