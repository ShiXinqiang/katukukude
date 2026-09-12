import { NextResponse } from "next/server";
import { getCurrentAdmin } from "../../../../lib/admin";
import { ensureMerchantSchema } from "../../../../lib/merchant";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ message: "需要管理员权限" }, { status: 401 });
    const database = await ensureMerchantSchema();
    const names = [
      ["users", "SELECT COUNT(*)::text AS count FROM users"],
      ["activeSessions", "SELECT COUNT(*)::text AS count FROM sessions WHERE expires_at > NOW()"],
      ["orders", "SELECT COUNT(*)::text AS count FROM orders"],
      ["broadcasts", "SELECT COUNT(*)::text AS count FROM broadcasts"],
      ["notifications", "SELECT COUNT(*)::text AS count FROM notifications"],
      ["merchants", "SELECT COUNT(*)::text AS count FROM merchants WHERE status = 'active'"],
      ["pendingApplications", "SELECT COUNT(*)::text AS count FROM merchant_applications WHERE status = 'pending'"],
    ] as const;
    const results = await Promise.all(names.map(([, query]) => database.query<{ count: string }>(query)));
    const overview = Object.fromEntries(names.map(([name], index) => [name, Number(results[index].rows[0]?.count ?? 0)]));
    return NextResponse.json({ overview });
  } catch (error) {
    console.error("Admin overview failed", error);
    return NextResponse.json({ message: "概览数据加载失败" }, { status: 500 });
  }
}
