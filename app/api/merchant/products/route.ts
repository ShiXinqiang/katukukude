import { NextResponse } from "next/server";
import { cleanText, createCommerceId, ensureMerchantSchema, isMerchantRequiredError, requireMerchant } from "../../../../lib/merchant";
import type { MerchantProductRecord } from "../../../../lib/data";

export const dynamic = "force-dynamic";

function serialize(row: MerchantProductRecord) {
  return {
    ...row,
    images: Array.isArray(row.images) ? row.images : [],
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export async function GET() {
  try {
    const { merchant } = await requireMerchant();
    const database = await ensureMerchantSchema();
    const result = await database.query<MerchantProductRecord>(
      `SELECT id, title, description, category, price::text, stock, status,
              images, created_at AS "createdAt", updated_at AS "updatedAt"
         FROM products WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [merchant.id],
    );
    return NextResponse.json({ products: result.rows.map(serialize) });
  } catch (error) {
    if (isMerchantRequiredError(error)) return NextResponse.json({ message: "需要商家权限" }, { status: 403 });
    return NextResponse.json({ message: "商品加载失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { merchant } = await requireMerchant();
    const body = (await request.json()) as Record<string, unknown>;
    const title = cleanText(body.title, 200);
    const description = cleanText(body.description, 3000);
    const category = cleanText(body.category, 80);
    const price = Number(body.price);
    const stock = Number(body.stock);
    const status = body.status === "active" ? "active" : "draft";
    if (!title || !description || !category || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ message: "请完整填写有效的商品信息" }, { status: 400 });
    }
    const database = await ensureMerchantSchema();
    const result = await database.query<MerchantProductRecord>(
      `INSERT INTO products (id, merchant_id, title, description, category, price, stock, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, title, description, category, price::text, stock, status,
                 images, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [createCommerceId(), merchant.id, title, description, category, price, stock, status],
    );
    return NextResponse.json({ product: serialize(result.rows[0]) }, { status: 201 });
  } catch (error) {
    if (isMerchantRequiredError(error)) return NextResponse.json({ message: "需要商家权限" }, { status: 403 });
    console.error("Merchant product create failed", error);
    return NextResponse.json({ message: "商品创建失败" }, { status: 500 });
  }
}
