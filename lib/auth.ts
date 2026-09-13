import { cookies } from "next/headers";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { AuthUser, UserRole } from "./data";
import { getDatabase } from "./db";

const scrypt = promisify(scryptCallback);
const sessionCookieName = "katu_session";
const sessionDurationMs = 1000 * 60 * 60 * 24 * 30;

type UserRow = {
  id: string;
  username: string;
  display_name: string;
  role: UserRole | string;
  status?: string;
  password_hash: string;
  created_at: Date | string;
};

export function normalizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidUsername(username: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9_.@\-]{2,63}$/.test(username);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, storedHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !storedHex || storedHex.length % 2) {
    return false;
  }

  const stored = Buffer.from(storedHex, "hex");
  const derived = (await scrypt(password, salt, stored.length)) as Buffer;

  return stored.length === derived.length && timingSafeEqual(stored, derived);
}

export async function ensureAuthSchema() {
  const database = getDatabase();

  await database.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username VARCHAR(64) NOT NULL UNIQUE,
      display_name VARCHAR(80) NOT NULL,
      role VARCHAR(16) NOT NULL DEFAULT 'user',
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role VARCHAR(16) NOT NULL DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS status VARCHAR(16) NOT NULL DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    DO $migration$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'users'::regclass
           AND conname = 'users_role_check'
           AND pg_get_constraintdef(oid) NOT ILIKE '%merchant%'
      ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'users'::regclass
           AND conname = 'users_role_check'
      ) THEN
        ALTER TABLE users
          ADD CONSTRAINT users_role_check
          CHECK (role IN ('user','merchant','admin'));
      END IF;
    END
    $migration$;

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
  `);

  return database;
}

export function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role === "admin" ? "admin" : row.role === "merchant" ? "merchant" : "user",
    status: row.status === "suspended" ? "suspended" : "active",
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const database = getDatabase();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + sessionDurationMs);

  await database.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, userId, expiresAt],
  );

  return token;
}

export function setSessionCookie(token: string) {
  cookies().set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDurationMs / 1000,
  });
}

export async function getCurrentUser() {
  const token = cookies().get(sessionCookieName)?.value;
  if (!token || !process.env.DATABASE_URL) return null;

  const database = await ensureAuthSchema();
  const result = await database.query<UserRow>(
    `SELECT u.id, u.username, u.display_name, u.role, u.status, u.password_hash, u.created_at
     FROM sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.status = 'active'
     LIMIT 1`,
    [hashSessionToken(token)],
  );

  return result.rows[0] ? toAuthUser(result.rows[0]) : null;
}

export async function deleteCurrentSession() {
  const token = cookies().get(sessionCookieName)?.value;
  if (token && process.env.DATABASE_URL) {
    const database = await ensureAuthSchema();
    await database.query("DELETE FROM sessions WHERE token_hash = $1", [
      hashSessionToken(token),
    ]);
  }

  cookies().set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function createUserId() {
  return randomUUID();
}
