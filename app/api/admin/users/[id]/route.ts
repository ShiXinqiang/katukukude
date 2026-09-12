import { NextResponse } from "next/server";
import type { UserRole, UserStatus } from "../../../../../lib/data";
import { getCurrentAdmin } from "../../../../../lib/admin";
import { ensureMerchantSchema } from "../../../../../lib/merchant";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ message: "需要管理员权限" }, { status: 401 });

    const body = (await request.json()) as { role?: unknown; status?: unknown; revokeSessions?: unknown };
    if (params.id === admin.id && (body.role !== undefined || body.status === "suspended")) {
      return NextResponse.json({ message: "不能修改当前管理员自身的角色或状态" }, { status: 400 });
    }

    const database = await ensureMerchantSchema();
    const targetResult = await database.query<{ role: UserRole; status: UserStatus }>(
      "SELECT role, status FROM users WHERE id = $1 LIMIT 1", [params.id],
    );
    const target = targetResult.rows[0];
    if (!target) return NextResponse.json({ message: "用户不存在" }, { status: 404 });

    let role = target.role;
    let status = target.status;
    if (body.role !== undefined) {
      if (body.role !== "user" && body.role !== "merchant" && body.role !== "admin") {
        return NextResponse.json({ message: "无效的用户角色" }, { status: 400 });
      }
      role = body.role;
      if (role === "merchant") {
        const merchant = await database.query("SELECT id FROM merchants WHERE user_id = $1 AND status = 'active' LIMIT 1", [params.id]).catch(() => ({ rows: [] }));
        if (!merchant.rows[0]) return NextResponse.json({ message: "该用户尚未通过商家审核" }, { status: 400 });
      }
    }
    if (body.status !== undefined) {
      if (body.status !== "active" && body.status !== "suspended") {
        return NextResponse.json({ message: "无效的账号状态" }, { status: 400 });
      }
      status = body.status;
    }

    if (target.role === "admin" && role !== "admin") {
      const adminCount = await database.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users WHERE role = 'admin'");
      if (Number(adminCount.rows[0]?.count ?? 0) <= 1) {
        return NextResponse.json({ message: "系统至少需要保留一名管理员" }, { status: 400 });
      }
    }

    const result = await database.query<AdminUserRecord>(
      `UPDATE users SET role = $2, status = $3, updated_at = NOW()
        WHERE id = $1
        RETURNING id, username, display_name AS "displayName", role, status,
                  created_at AS "createdAt"`,
      [params.id, role, status],
    );
    if (body.revokeSessions === true || status === "suspended") {
      await database.query("DELETE FROM sessions WHERE user_id = $1", [params.id]);
    }
    return NextResponse.json({
      user: { ...result.rows[0], createdAt: new Date(result.rows[0].createdAt).toISOString() },
    });
  } catch (error) {
    console.error("Admin user update failed", error);
    return NextResponse.json({ message: "用户权限更新失败" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ message: "需要管理员权限" }, { status: 401 });
    if (params.id === admin.id) return NextResponse.json({ message: "不能删除当前管理员账号" }, { status: 400 });

    const database = await ensureMerchantSchema();
    const target = await database.query<{ role: string }>("SELECT role FROM users WHERE id = $1 LIMIT 1", [params.id]);
    if (!target.rows[0]) return NextResponse.json({ message: "用户不存在" }, { status: 404 });
    if (target.rows[0].role === "admin") {
      const admins = await database.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users WHERE role = 'admin'");
      if (Number(admins.rows[0]?.count ?? 0) <= 1) {
        return NextResponse.json({ message: "系统至少需要保留一名管理员" }, { status: 400 });
      }
    }
    await database.query("DELETE FROM users WHERE id = $1", [params.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user delete failed", error);
    return NextResponse.json({ message: "用户删除失败" }, { status: 500 });
  }
}
