import { NextResponse } from "next/server";
import type { UserRole } from "../../../../../lib/data";
import { ensureAdminSchema, getCurrentAdmin } from "../../../../../lib/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ message: "需要管理员权限" }, { status: 401 });
    }

    const body = (await request.json()) as { role?: unknown };
    const role = body.role === "admin" || body.role === "user" ? body.role : null;

    if (!role) {
      return NextResponse.json({ message: "无效的用户角色" }, { status: 400 });
    }

    if (params.id === admin.id && role !== "admin") {
      return NextResponse.json(
        { message: "不能移除当前管理员权限" },
        { status: 400 },
      );
    }

    const database = await ensureAdminSchema();

    if (role === "user") {
      const adminCount = await database.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM users WHERE role = 'admin'",
      );
      const target = await database.query<{ role: string }>(
        "SELECT role FROM users WHERE id = $1 LIMIT 1",
        [params.id],
      );

      if (
        target.rows[0]?.role === "admin" &&
        Number(adminCount.rows[0]?.count ?? 0) <= 1
      ) {
        return NextResponse.json(
          { message: "系统至少需要保留一名管理员" },
          { status: 400 },
        );
      }
    }

    const result = await database.query<{
      id: string;
      username: string;
      displayName: string;
      role: UserRole;
      createdAt: Date | string;
    }>(
      `UPDATE users
       SET role = $2
       WHERE id = $1
       RETURNING id, username, display_name AS "displayName", role,
                 created_at AS "createdAt"`,
      [params.id, role],
    );

    if (!result.rows[0]) {
      return NextResponse.json({ message: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...result.rows[0],
        createdAt: new Date(result.rows[0].createdAt).toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin user role update failed", error);
    return NextResponse.json(
      { message: "用户角色更新失败" },
      { status: 500 },
    );
  }
}
