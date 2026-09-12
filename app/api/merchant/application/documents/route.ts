import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth";
import { createCommerceId, ensureMerchantSchema } from "../../../../../lib/merchant";

export const dynamic = "force-dynamic";
const allowedKinds = ["identity_front", "identity_back", "business_license", "storefront", "other"];
const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "请先登录" }, { status: 401 });
    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "other");
    if (!(file instanceof File)) return NextResponse.json({ message: "请选择文件" }, { status: 400 });
    if (!allowedKinds.includes(kind) || !allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: "仅支持 JPG、PNG、WEBP 或 PDF 证明文件" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "单个文件大小需在 5MB 以内" }, { status: 400 });
    }

    const id = createCommerceId();
    const database = await ensureMerchantSchema();
    await database.query(
      `INSERT INTO merchant_application_documents
        (id, user_id, kind, file_name, mime_type, file_size, content)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, user.id, kind, file.name.slice(0, 255), file.type, file.size, Buffer.from(await file.arrayBuffer())],
    );
    return NextResponse.json({ document: { id, kind, fileName: file.name, fileSize: file.size } }, { status: 201 });
  } catch (error) {
    console.error("Merchant document upload failed", error);
    return NextResponse.json({ message: "证明文件上传失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "请先登录" }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ message: "缺少文件编号" }, { status: 400 });
    const database = await ensureMerchantSchema();
    const result = await database.query(
      "DELETE FROM merchant_application_documents WHERE id = $1 AND user_id = $2 AND application_id IS NULL RETURNING id",
      [id, user.id],
    );
    if (!result.rows[0]) return NextResponse.json({ message: "文件不存在或已随申请提交" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Merchant document delete failed", error);
    return NextResponse.json({ message: "删除文件失败" }, { status: 500 });
  }
}
