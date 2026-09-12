import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { ensureAdminSchema } from "./admin";
import { getCurrentUser } from "./auth";
import type { AuthUser, MerchantRecord } from "./data";

export async function ensureMerchantSchema(): Promise<Pool> {
  const database = await ensureAdminSchema();

  await database.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS status VARCHAR(16) NOT NULL DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    CREATE TABLE IF NOT EXISTS merchant_applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      store_name_cn VARCHAR(120),
      store_name_mm VARCHAR(160),
      legal_name VARCHAR(120),
      contact_name VARCHAR(120),
      phone VARCHAR(32) NOT NULL,
      email VARCHAR(160),
      tg_account VARCHAR(100),
      wechat_account VARCHAR(100),
      business_type VARCHAR(64) NOT NULL,
      license_no VARCHAR(100),
      identity_no VARCHAR(100),
      state_region VARCHAR(100) NOT NULL,
      city VARCHAR(100) NOT NULL,
      township VARCHAR(100) NOT NULL,
      address TEXT NOT NULL,
      map_link TEXT,
      location_lat NUMERIC(10,7),
      location_lng NUMERIC(10,7),
      description TEXT NOT NULL,
      document_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      status VARCHAR(16) NOT NULL DEFAULT 'pending',
      review_note TEXT,
      reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMPTZ,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE merchant_applications
      ALTER COLUMN store_name_cn DROP NOT NULL,
      ALTER COLUMN legal_name DROP NOT NULL,
      ALTER COLUMN contact_name DROP NOT NULL,
      ALTER COLUMN identity_no DROP NOT NULL,
      ADD COLUMN IF NOT EXISTS tg_account VARCHAR(100),
      ADD COLUMN IF NOT EXISTS wechat_account VARCHAR(100),
      ADD COLUMN IF NOT EXISTS location_lat NUMERIC(10,7),
      ADD COLUMN IF NOT EXISTS location_lng NUMERIC(10,7);

    CREATE TABLE IF NOT EXISTS merchant_application_documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      application_id TEXT REFERENCES merchant_applications(id) ON DELETE CASCADE,
      kind VARCHAR(32) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 31457280),
      content BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      application_id TEXT UNIQUE REFERENCES merchant_applications(id) ON DELETE SET NULL,
      store_name_cn VARCHAR(120) NOT NULL,
      store_name_mm VARCHAR(160),
      phone VARCHAR(32) NOT NULL,
      business_type VARCHAR(64) NOT NULL,
      state_region VARCHAR(100) NOT NULL,
      city VARCHAR(100) NOT NULL,
      township VARCHAR(100) NOT NULL,
      address TEXT NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'active',
      approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(80) NOT NULL,
      price NUMERIC(14,2) NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(16) NOT NULL DEFAULT 'draft',
      images JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS merchant_id TEXT REFERENCES merchants(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS merchant_applications_status_idx
      ON merchant_applications(status, submitted_at DESC);
    CREATE INDEX IF NOT EXISTS merchant_documents_user_idx
      ON merchant_application_documents(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS products_merchant_idx
      ON products(merchant_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS orders_merchant_idx
      ON orders(merchant_id, created_at DESC);
  `);

  return database;
}

export async function getCurrentMerchant(): Promise<{
  user: AuthUser;
  merchant: MerchantRecord;
} | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "merchant" || user.status === "suspended") return null;

  const database = await ensureMerchantSchema();
  const result = await database.query<{
    id: string;
    userId: string;
    storeNameCn: string;
    storeNameMm: string | null;
    phone: string;
    businessType: string;
    stateRegion: string;
    city: string;
    township: string;
    address: string;
    description: string;
    status: string;
    approvedAt: Date | string;
  }>(
    `SELECT id, user_id AS "userId", store_name_cn AS "storeNameCn",
            store_name_mm AS "storeNameMm", phone,
            business_type AS "businessType", state_region AS "stateRegion",
            city, township, address, description, status,
            approved_at AS "approvedAt"
       FROM merchants
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1`,
    [user.id],
  );

  if (!result.rows[0]) return null;
  return {
    user,
    merchant: {
      ...result.rows[0],
      approvedAt: new Date(result.rows[0].approvedAt).toISOString(),
    } as MerchantRecord,
  };
}

export async function requireMerchant() {
  const merchant = await getCurrentMerchant();
  if (!merchant) throw new Error("MERCHANT_REQUIRED");
  return merchant;
}

export function isMerchantRequiredError(error: unknown) {
  return error instanceof Error && error.message === "MERCHANT_REQUIRED";
}

export function createCommerceId() {
  return randomUUID();
}

export function cleanText(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function cleanOptionalText(value: unknown, max = 200) {
  const text = cleanText(value, max);
  return text || null;
}
