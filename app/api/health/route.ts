import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        database: "not-configured",
        message: "DATABASE_URL is not configured",
      },
      { status: 503 },
    );
  }

  try {
    const database = getDatabase();
    const result = await database.query<{ now: string }>(
      "select now()::text as now",
    );

    return NextResponse.json({
      ok: true,
      database: "supabase-postgres",
      schema: process.env.DB_SCHEMA?.trim() || "public",
      now: result.rows[0]?.now ?? null,
    });
  } catch (error) {
    console.error("PostgreSQL health check failed", error);

    return NextResponse.json(
      {
        ok: false,
        database: "supabase-postgres",
        message: "PostgreSQL connection failed",
      },
      { status: 503 },
    );
  }
}
