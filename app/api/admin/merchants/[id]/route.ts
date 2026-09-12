import { NextResponse } from "next/server";
import { getCurrentAdmin } from "../../../../../lib/admin";
import { ensureMerchantSchema } from "../../../../../lib/merchant";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ message: "需要超级管理员权限" }, { status: 401 });
    const body = (await request.json()) as { status?: unknown };
    if (body.status !== "active" && body.status !== "suspended" && body.status !== "closed") {
      return NextResponse.json({ message: "商家状态无效" }, { status: 400 });
    }
    const database = await ensureMerchantSchema();
    const result = await database.query<{ userId: string }>(
      `UPDATE merchants SET status = $2, updated_at = NOW()
        WHERE id = $1 RETURNING user_id AS "userId"`,
      [params.id, body.status],
    );
    if (!result.rows[0]) return NextResponse.json({ message: "商家不存在" }, { status: 404 });
    if (body.status === "active") {
      await database.query("UPDATE users SET role = CASE WHEN role='admin' THEN role ELSE 'merchant' END, updated_at=NOW() WHERE id=$1", [result.rows[0].userId]);
    } else if (body.status === "closed") {
      await database.query("UPDATE users SET role = CASE WHEN role='admin' THEN role ELSE 'user' END, updated_at=NOW() WHERE id=$1", [result.rows[0].userId]);
    }
    await database.query("DELETE FROM sessions WHERE user_id=$1", [result.rows[0].userId]);
    return NextResponse.json({ success: true, status: body.status });
  } catch (error) {
    console.error("Admin merchant update failed", error);
    return NextResponse.json({ message: "商家状态更新失败" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ message: "需要超级管理员权限" }, { status: 401 });
    const database = await ensureMerchantSchema();
    const result = await database.query<{ userId: string }>("DELETE FROM merchants WHERE id=$1 RETURNING user_id AS \"userId\"", [params.id]);
    if (!result.rows[0]) return NextResponse.json({ message: "商家不存在" }, { status: 404 });
    await database.query("UPDATE users SET role=CASE WHEN role='admin' THEN role ELSE 'user' END, updated_at=NOW() WHERE id=$1", [result.rows[0].userId]);
    await database.query("DELETE FROM sessions WHERE user_id=$1", [result.rows[0].userId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin merchant delete failed", error);
    return NextResponse.json({ message: "删除商家失败" }, { status: 500 });
  }
}
