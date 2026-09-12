import { NextResponse } from "next/server";
import { ensureAdminSchema, getCurrentAdmin } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ message: "需要管理员权限" }, { status: 401 });
    }

    const database = await ensureAdminSchema();
    const [users, sessions, orders, broadcasts, notifications] =
      await Promise.all([
        database.query<{ count: string }>(
          "SELECT COUNT(*)::text AS count FROM users",
        ),
        database.query<{ count: string }>(
          "SELECT COUNT(*)::text AS count FROM sessions WHERE expires_at > NOW()",
        ),
        database.query<{ count: string }>(
          "SELECT COUNT(*)::text AS count FROM orders",
        ),
        database.query<{ count: string }>(
          "SELECT COUNT(*)::text AS count FROM broadcasts",
        ),
        database.query<{ count: string }>(
          "SELECT COUNT(*)::text AS count FROM notifications",
        ),
      ]);

    return NextResponse.json({
      overview: {
        users: Number(users.rows[0]?.count ?? 0),
        activeSessions: Number(sessions.rows[0]?.count ?? 0),
        orders: Number(orders.rows[0]?.count ?? 0),
        broadcasts: Number(broadcasts.rows[0]?.count ?? 0),
        notifications: Number(notifications.rows[0]?.count ?? 0),
      },
    });
  } catch (error) {
    console.error("Admin overview failed", error);
    return NextResponse.json(
      { message: "概览数据加载失败" },
      { status: 500 },
    );
  }
}
