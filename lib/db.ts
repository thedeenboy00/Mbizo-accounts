import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "mbizo.db");

function getDb(): Database.Database {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export function initDb(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('DEBIT','CREDIT')),
      category TEXT NOT NULL CHECK(category IN ('BEAM','PLAN','HIGHERLIFE','CAMFED','CHILDCARE','SELF')),
      reference TEXT NOT NULL,
      account TEXT NOT NULL CHECK(account IN ('Cash','Bank')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_by_id TEXT NOT NULL,
      FOREIGN KEY (created_by_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      account TEXT NOT NULL,
      debit REAL NOT NULL DEFAULT 0,
      credit REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );
  `);

  db.close();
}

export function query<T>(sql: string, params: unknown[] = []): T[] {
  const db = getDb();
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  } finally {
    db.close();
  }
}

export function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
  const db = getDb();
  try {
    const stmt = db.prepare(sql);
    return stmt.get(...params) as T | undefined;
  } finally {
    db.close();
  }
}

export function execute(sql: string, params: unknown[] = []): Database.RunResult {
  const db = getDb();
  try {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  } finally {
    db.close();
  }
}

export function executeTransaction(fn: (db: Database.Database) => void): void {
  const db = getDb();
  try {
    const trx = db.transaction(fn);
    trx(db);
  } finally {
    db.close();
  }
}
