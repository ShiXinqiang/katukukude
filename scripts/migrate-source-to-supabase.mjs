import { Pool } from "pg";

const sourceConnectionString = process.env.SOURCE_DATABASE_URL;
const targetConnectionString = process.env.DATABASE_URL;

if (!sourceConnectionString || !targetConnectionString) {
  throw new Error(
    "SOURCE_DATABASE_URL and DATABASE_URL must both be configured",
  );
}

if (sourceConnectionString === targetConnectionString) {
  throw new Error("SOURCE_DATABASE_URL and DATABASE_URL must be different");
}

const ssl = { rejectUnauthorized: false };
const source = new Pool({
  connectionString: sourceConnectionString,
  ssl,
  max: 2,
});
const target = new Pool({
  connectionString: targetConnectionString,
  ssl,
  options: '-c search_path="katu",public',
  max: 2,
});

const tables = [
  {
    name: "users",
    columns: [
      "id",
      "username",
      "display_name",
      "role",
      "password_hash",
      "created_at",
    ],
    conflict: "id",
    updateColumns: [
      "username",
      "display_name",
      "role",
      "password_hash",
      "created_at",
    ],
  },
  {
    name: "sessions",
    columns: ["token_hash", "user_id", "expires_at", "created_at"],
    conflict: "token_hash",
    updateColumns: ["user_id", "expires_at", "created_at"],
  },
  {
    name: "orders",
    columns: [
      "id",
      "order_no",
      "user_id",
      "status",
      "payment_status",
      "total_amount",
      "paid_amount",
      "transaction_id",
      "shipping_name",
      "shipping_phone",
      "shipping_address",
      "items",
      "created_at",
      "updated_at",
    ],
    conflict: "id",
    updateColumns: [
      "order_no",
      "user_id",
      "status",
      "payment_status",
      "total_amount",
      "paid_amount",
      "transaction_id",
      "shipping_name",
      "shipping_phone",
      "shipping_address",
      "items",
      "created_at",
      "updated_at",
    ],
  },
  {
    name: "notifications",
    columns: [
      "id",
      "user_id",
      "type",
      "title",
      "content",
      "read_at",
      "created_at",
    ],
    conflict: "id",
    updateColumns: [
      "user_id",
      "type",
      "title",
      "content",
      "read_at",
      "created_at",
    ],
  },
  {
    name: "broadcasts",
    columns: [
      "id",
      "title",
      "content",
      "recipient_count",
      "created_by",
      "created_at",
    ],
    conflict: "id",
    updateColumns: [
      "title",
      "content",
      "recipient_count",
      "created_by",
      "created_at",
    ],
  },
];

function quotedColumns(columns) {
  return columns.map((column) => `"${column}"`).join(", ");
}

function insertStatement(table) {
  const values = table.columns.map((_, index) => `$${index + 1}`).join(", ");
  const updates = table.updateColumns
    .map((column) => `"${column}" = EXCLUDED."${column}"`)
    .join(", ");

  return `INSERT INTO katu."${table.name}" (${quotedColumns(table.columns)})
    VALUES (${values})
    ON CONFLICT ("${table.conflict}") DO UPDATE SET ${updates}`;
}

async function main() {
  await target.query("CREATE SCHEMA IF NOT EXISTS katu");
  const targetClient = await target.connect();
  const summary = [];

  try {
    await targetClient.query("BEGIN");

    for (const table of tables) {
      const result = await source.query(
        `SELECT ${quotedColumns(table.columns)}
         FROM public."${table.name}"
         ORDER BY 1`,
      );
      const statement = insertStatement(table);

      for (const row of result.rows) {
        await targetClient.query(
          statement,
          table.columns.map((column) => row[column]),
        );
      }

      summary.push({ table: table.name, rows: result.rowCount ?? result.rows.length });
    }

    await targetClient.query("COMMIT");
  } catch (error) {
    await targetClient.query("ROLLBACK");
    throw error;
  } finally {
    targetClient.release();
  }

  console.log(JSON.stringify({ ok: true, migrated: summary }));
}

try {
  await main();
} finally {
  await Promise.all([source.end(), target.end()]);
}
