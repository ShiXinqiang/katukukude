import { NextResponse } from "next/server";
import { cleanText, ensureMerchantSchema, isMerchantRequiredError, requireMerchant } from "../../../../../lib/merchant";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { merchant } = await requireMerchant();
    const body = (await request.json()) as Record<string, unknown>;
    const database = await ensureMerchantSchema();
    const current = await database.query<{ title: string; description: string; category: string; price: string; stock: number; status: string }>(
      "SELECT title, description, category, price::text, stock, status FROM products WHERE id = $1 AND merchant_id = $2 LIMIT 1",
      [params.id, merchant.id],
    );
    if (!current.rows[0]) return NextResponse.json({ message: "商品不存在" }, { status: 404 });
    const row = current.rows[0];
    const title = body.title === undefined ? row.title : cleanText(body.title, 200);
    const description = body.description === undefined ? row.description : cleanText(body.description, 3000);
    const category = body.category === undefined ? row.category : cleanText(body.category, 80);
    const price = body.price === undefined ? Number(row.price) : Number(body.price);
    const stock = body.stock === undefined ? row.stock : Number(body.stock);
    const status = body.status === undefined ? row.status : body.status;
    if (!title || !description || !category || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0 || !["draft","active","archived"].includes(String(status))) {
      return NextResponse.json({ message: "商品信息无效" }, { status: 400 });
    }
    const result = await database.query(
      `UPDATE products SET title=$3, description=$4, category=$5, price=$6,
              stock=$7, status=$8, updated_at=NOW()
        WHERE id=$1 AND merchant_id=$2
        RETURNING id, title, description, category, price::text, stock, status,
                  images, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [params.id, merchant.id, title, description, category, price, stock, status],
    );
    return NextResponse.json({ product: result.rows[0] });
  } catch (error) {
    if (isMerchantRequiredError(error)) return NextResponse.json({ message: "需要商家权限" }, { status: 403 });
    return NextResponse.json({ message: "商品更新失败" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { merchant } = await requireMerchant();
    const database = await ensureMerchantSchema();
    const result = await database.query("DELETE FROM products WHERE id=$1 AND merchant_id=$2 RETURNING id", [params.id, merchant.id]);
    if (!result.rows[0]) return NextResponse.json({ message: "商品不存在" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isMerchantRequiredError(error)) return NextResponse.json({ message: "需要商家权限" }, { status: 403 });
    return NextResponse.json({ message: "商品删除失败" }, { status: 500 });
  }
}
