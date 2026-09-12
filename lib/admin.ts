import type { Pool } from "pg";
import type { AuthUser } from "./data";
import { ensureAuthSchema, getCurrentUser } from "./auth";

export async function ensureAdminSchema(): Promise<Pool> {
  const database = await ensureAuthSchema();

  await database.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no VARCHAR(64) NOT NULL UNIQUE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid',
      total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      paid_amount NUMERIC(12, 2),
      transaction_id VARCHAR(160),
      shipping_name VARCHAR(80),
      shipping_phone VARCHAR(32),
      shipping_address TEXT,
      items JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
    CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(32) NOT NULL DEFAULT 'system',
      title VARCHAR(160) NOT NULL,
      content TEXT NOT NULL,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS notifications_user_id_idx
      ON notifications(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS broadcasts (
      id TEXT PRIMARY KEY,
      title VARCHAR(160) NOT NULL,
      content TEXT NOT NULL,
      recipient_count INTEGER NOT NULL DEFAULT 0,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS broadcasts_created_at_idx
      ON broadcasts(created_at DESC);
  `);

  return database;
}

export async function getCurrentAdmin(): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error("ADMIN_REQUIRED");
  }

  return admin;
}

export function isAdminRequiredError(error: unknown) {
  return error instanceof Error && error.message === "ADMIN_REQUIRED";
}
