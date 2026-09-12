import { NextResponse } from "next/server";
import type { AdminUserRecord } from "../../../../lib/data";
import { ensureAdminSchema, getCurrentAdmin } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ message: "需要管理员权限" }, { status: 401 });

    const searchParams = new URL(request.url).searchParams;
    const page = Math.max(1, Number(searchParams.get("page") || 1) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 20) || 20));
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status") || "";
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (search) {
      values.push(`%${search}%`);
      clauses.push(`(username ILIKE $${values.length} OR display_name ILIKE $${values.length})`);
    }
    if (status === "active" || status === "suspended") {
      values.push(status);
      clauses.push(`status = $${values.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const database = await ensureAdminSchema();
    const countResult = await database.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM users ${where}`, values,
    );
    values.push(pageSize, (page - 1) * pageSize);
    const userResult = await database.query<AdminUserRecord>(
      `SELECT id, username, display_name AS "displayName", role, status,
              created_at AS "createdAt"
         FROM users ${where}
        ORDER BY created_at DESC
        LIMIT $${values.length - 1} OFFSET $${values.length}`, values,
    );

    return NextResponse.json({
      users: userResult.rows.map((user) => ({ ...user, createdAt: new Date(user.createdAt).toISOString() })),
      page, pageSize, total: Number(countResult.rows[0]?.count ?? 0),
    });
  } catch (error) {
    console.error("Admin user list failed", error);
    return NextResponse.json({ message: "用户数据加载失败" }, { status: 500 });
  }
}
