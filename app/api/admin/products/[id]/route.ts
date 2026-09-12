import { NextResponse } from "next/server";
import { getCurrentAdmin } from "../../../../../lib/admin";
import { ensureMerchantSchema } from "../../../../../lib/merchant";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ message: "需要超级管理员权限" }, { status: 401 });
    const body = (await request.json()) as { status?: unknown };
    if (body.status !== "draft" && body.status !== "active" && body.status !== "archived") {
      return NextResponse.json({ message: "商品状态无效" }, { status: 400 });
    }
    const database = await ensureMerchantSchema();
    const result = await database.query("UPDATE products SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING id", [params.id, body.status]);
    if (!result.rows[0]) return NextResponse.json({ message: "商品不存在" }, { status: 404 });
    return NextResponse.json({ success: true, status: body.status });
  } catch (error) {
    return NextResponse.json({ message: "商品状态更新失败" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ message: "需要超级管理员权限" }, { status: 401 });
    const database = await ensureMerchantSchema();
    const result = await database.query("DELETE FROM products WHERE id=$1 RETURNING id", [params.id]);
    if (!result.rows[0]) return NextResponse.json({ message: "商品不存在" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "删除商品失败" }, { status: 500 });
  }
}
