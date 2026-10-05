import { NextResponse } from "next/server";
import { requireMerchant, isMerchantRequiredError } from "../../../../../lib/merchant";
import { changeOrder } from "../../../../../lib/order-actions";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { merchant } = await requireMerchant();
    const body = await request.json();
    if (!["accept", "ship"].includes(body.action)) return NextResponse.json({ message: "操作无效" }, { status: 400 });
    return NextResponse.json(await changeOrder(params.id, merchant.id, "merchant", body.action,body.shipment));
  } catch (error) {
    return NextResponse.json({ message: isMerchantRequiredError(error) ? "需要商家权限" : error instanceof Error ? error.message : "订单操作失败" }, { status: isMerchantRequiredError(error) ? 403 : 409 });
  }
}
