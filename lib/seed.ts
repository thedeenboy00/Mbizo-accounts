import { initDb, queryOne, execute } from "./db";
import { hashPassword, generateId } from "./auth";

interface UserRow {
  id: string;
}

async function seed(): Promise<void> {
  initDb();

  // Ensure sessions table exists
  execute(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )`);

  const existing = queryOne<UserRow>(
    "SELECT id FROM users WHERE username = ?",
    ["admin"]
  );

  if (!existing) {
    const hash = await hashPassword("admin123");
    const id = generateId();
    execute(
      "INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)",
      [id, "admin", hash, "admin"]
    );
    console.log("Seeded admin user: admin / admin123");
  } else {
    console.log("Admin user already exists");
  }
}

seed().catch(console.error);
