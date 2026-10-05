import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { ensureAdminSchema } from "./admin";
import { getCurrentUser } from "./auth";
import type { AuthUser, MerchantRecord } from "./data";

async function initializeMerchantSchema(): Promise<Pool> {
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

    DO $migration$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='products'::regclass AND conname='products_status_check' AND position('pending' in pg_get_constraintdef(oid))=0) THEN
        ALTER TABLE products DROP CONSTRAINT products_status_check;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='products'::regclass AND conname='products_status_check') THEN
        ALTER TABLE products ADD CONSTRAINT products_status_check CHECK(status IN ('draft','pending','active','rejected','archived'));
      END IF;
    END $migration$;

    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS product_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS subtitle VARCHAR(160),
      ADD COLUMN IF NOT EXISTS original_price NUMERIC(14,2),
      ADD COLUMN IF NOT EXISTS badge VARCHAR(32),
      ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS specifications JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(14,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS service_guarantees JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS promotion_title VARCHAR(80),
      ADD COLUMN IF NOT EXISTS promotion_start TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS promotion_end TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
      ADD COLUMN IF NOT EXISTS sales_count INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS rating_average NUMERIC(3,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS product_media (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      mime_type VARCHAR(100) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size INTEGER NOT NULL CHECK(file_size > 0 AND file_size <= 8388608),
      content BYTEA NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE product_media ALTER COLUMN product_id DROP NOT NULL;
    ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;

    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS merchant_id TEXT REFERENCES merchants(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS shipment JSONB,
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS checkout_key TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_key_idx ON orders(user_id,merchant_id,checkout_key) WHERE checkout_key IS NOT NULL;
    CREATE TABLE IF NOT EXISTS after_sales (
      id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id), user_id TEXT NOT NULL REFERENCES users(id),merchant_id TEXT NOT NULL REFERENCES merchants(id),
      kind TEXT NOT NULL CHECK(kind IN ('refund','return_refund')),reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','approved','rejected','refunded')),
      merchant_reply TEXT,review_note TEXT,refund_reference TEXT,amount NUMERIC(12,2),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS after_sales_open_order_idx ON after_sales(order_id) WHERE status IN ('requested','approved','refunded');
    ALTER TABLE after_sales ENABLE ROW LEVEL SECURITY;

    CREATE TABLE IF NOT EXISTS shop_conversations (
      id TEXT PRIMARY KEY,buyer_id TEXT NOT NULL REFERENCES users(id),merchant_id TEXT NOT NULL REFERENCES merchants(id),
      context_key TEXT NOT NULL,context JSONB NOT NULL,buyer_read_seq BIGINT NOT NULL DEFAULT 0,seller_read_seq BIGINT NOT NULL DEFAULT 0,
      last_message TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(buyer_id,merchant_id,context_key)
    );
    CREATE TABLE IF NOT EXISTS shop_messages (
      seq BIGSERIAL PRIMARY KEY,id TEXT NOT NULL UNIQUE,conversation_id TEXT NOT NULL REFERENCES shop_conversations(id),
      sender_id TEXT NOT NULL REFERENCES users(id),client_nonce TEXT NOT NULL,content TEXT NOT NULL CHECK(char_length(content) BETWEEN 1 AND 2000),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),UNIQUE(conversation_id,sender_id,client_nonce)
    );
    ALTER TABLE shop_conversations ADD COLUMN IF NOT EXISTS merged_into TEXT REFERENCES shop_conversations(id);
    ALTER TABLE shop_messages ADD COLUMN IF NOT EXISTS context JSONB;
    CREATE UNIQUE INDEX IF NOT EXISTS shop_conversations_pair_idx ON shop_conversations(buyer_id,merchant_id) WHERE merged_into IS NULL;
    CREATE INDEX IF NOT EXISTS shop_conversations_buyer_idx ON shop_conversations(buyer_id,updated_at DESC);
    CREATE INDEX IF NOT EXISTS shop_conversations_merchant_idx ON shop_conversations(merchant_id,updated_at DESC);
    CREATE INDEX IF NOT EXISTS shop_messages_thread_idx ON shop_messages(conversation_id,seq);
    CREATE INDEX IF NOT EXISTS shop_messages_sender_idx ON shop_messages(sender_id,created_at DESC);
    ALTER TABLE shop_conversations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE shop_messages ENABLE ROW LEVEL SECURITY;

    CREATE TABLE IF NOT EXISTS product_reviews (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), user_id TEXT NOT NULL REFERENCES users(id),
      product_id TEXT NOT NULL, product_title TEXT NOT NULL, spec TEXT,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), content TEXT NOT NULL CHECK(char_length(content) BETWEEN 5 AND 2000),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(order_id,product_id)
    );
    CREATE INDEX IF NOT EXISTS product_reviews_product_idx ON product_reviews(product_id,created_at DESC);
    CREATE INDEX IF NOT EXISTS product_reviews_user_idx ON product_reviews(user_id,created_at DESC);
    ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

    CREATE TABLE IF NOT EXISTS commerce_settings (key TEXT PRIMARY KEY,value JSONB NOT NULL,revision INTEGER NOT NULL DEFAULT 1,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    ALTER TABLE commerce_settings ENABLE ROW LEVEL SECURITY;
    CREATE TABLE IF NOT EXISTS commerce_audit (id TEXT PRIMARY KEY, actor_id TEXT, target_id TEXT NOT NULL, action TEXT NOT NULL, details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    ALTER TABLE commerce_audit ENABLE ROW LEVEL SECURITY;
    CREATE INDEX IF NOT EXISTS commerce_audit_target_idx ON commerce_audit(target_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS merchant_applications_status_idx
      ON merchant_applications(status, submitted_at DESC);
    CREATE INDEX IF NOT EXISTS merchant_documents_user_idx
      ON merchant_application_documents(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS products_merchant_idx
      ON products(merchant_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS products_storefront_idx
      ON products(status, is_featured DESC, is_recommended DESC, sort_order DESC, updated_at DESC);
    CREATE INDEX IF NOT EXISTS product_media_product_idx
      ON product_media(product_id, sort_order, created_at);
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
  if (!user || !["merchant", "admin"].includes(user.role) || user.status === "suspended") return null;

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

let schemaReady: Promise<Awaited<ReturnType<typeof initializeMerchantSchema>>> | undefined;
export function ensureMerchantSchema() {
  if (!schemaReady) schemaReady = initializeMerchantSchema().catch(error => { schemaReady = undefined; throw error; });
  return schemaReady;
}
