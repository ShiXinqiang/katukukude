export const orderLabels: Record<string, string> = {
  pending: "待付款", paid: "待接单", processing: "准备中", shipped: "已发货 / 服务中",
  completed: "已完成", cancelled: "已取消", unpaid: "未付款", refunded: "已退款",
};

export function nextOrderStatus(status: string, payment: string, action: string, actor: "customer" | "merchant") {
  if (actor === "customer" && action === "cancel" && status === "pending" && payment === "unpaid") return "cancelled";
  if (payment !== "paid") throw new Error("订单尚未付款，不能进行此操作");
  if (actor === "merchant" && action === "accept" && status === "paid") return "processing";
  if (actor === "merchant" && action === "ship" && status === "processing") return "shipped";
  if (actor === "customer" && action === "complete" && status === "shipped") return "completed";
  throw new Error("订单状态已变化，请刷新后重试");
}

export function requestedItems(items: unknown) {
  if (!Array.isArray(items) || !items.length || items.length > 100) throw new Error("请选择结算商品");
  const lines = new Map<string, { productId: string; quantity: number; spec: string }>();
  for (const item of items) {
    if (!item || typeof item.id !== "string" || item.id.length > 600) throw new Error("商品无效");
    const productId = item.id.split("::")[0];
    const quantity = Number(item.quantity);
    const spec = typeof item.spec === "string" ? item.spec.trim().slice(0, 300) || "默认规格" : "默认规格";
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("商品数量无效");
    const key = JSON.stringify([productId, spec]);
    const total = (lines.get(key)?.quantity || 0) + quantity;
    if (total > 99) throw new Error("同一规格最多购买99件");
    lines.set(key, { productId, quantity: total, spec });
  }
  return Array.from(lines.values());
}
