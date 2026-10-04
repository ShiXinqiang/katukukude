import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { changeOrder } from "../../../../lib/order-actions";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "请先登录" }, { status: 401 });
    const body = await request.json();
    if (!["cancel", "complete"].includes(body.action)) return NextResponse.json({ message: "操作无效" }, { status: 400 });
    return NextResponse.json(await changeOrder(params.id, user.id, "customer", body.action));
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "订单操作失败" }, { status: 409 });
  }
}
