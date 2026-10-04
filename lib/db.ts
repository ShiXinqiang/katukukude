import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var katukukudeDbPool: Pool | undefined;
}

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  const schema = process.env.DB_SCHEMA?.trim() || "public";

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
    throw new Error("DB_SCHEMA is invalid");
  }

  if (!globalThis.katukukudeDbPool) {
    globalThis.katukukudeDbPool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
      options: `-c search_path=\"${schema}\",public`,
      max: 5,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      query_timeout: 20000,
    });
  }

  return globalThis.katukukudeDbPool;
}
