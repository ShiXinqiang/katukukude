import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth";
import { createCommerceId, ensureMerchantSchema } from "../../../../../lib/merchant";

export const dynamic = "force-dynamic";

const allowedKinds = ["store_photo", "store_video"];
const photoTypes = ["image/jpeg", "image/png", "image/webp"];
const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "请先登录" }, { status: 401 });

    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "请选择文件" }, { status: 400 });
    }
    if (!allowedKinds.includes(kind)) {
      return NextResponse.json({ message: "证明资料类型无效" }, { status: 400 });
    }

    const isPhoto = kind === "store_photo";
    const accepted = isPhoto ? photoTypes.includes(file.type) : videoTypes.includes(file.type);
    const maxSize = isPhoto ? 8 * 1024 * 1024 : 30 * 1024 * 1024;
    if (!accepted) {
      return NextResponse.json(
        { message: isPhoto ? "店铺照片仅支持 JPG、PNG 或 WEBP" : "现场视频仅支持 MP4、WEBM 或 MOV" },
        { status: 400 },
      );
    }
    if (file.size <= 0 || file.size > maxSize) {
      return NextResponse.json(
        { message: isPhoto ? "单张照片需在 8MB 以内" : "现场视频需在 30MB 以内" },
        { status: 400 },
      );
    }

    const database = await ensureMerchantSchema();
    const existingCount = await database.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM merchant_application_documents WHERE user_id = $1 AND kind = $2 AND application_id IS NULL",
      [user.id, kind],
    );
    const limit = isPhoto ? 4 : 1;
    if (Number(existingCount.rows[0]?.count ?? 0) >= limit) {
      return NextResponse.json(
        { message: isPhoto ? "未提交的店铺照片最多保留 4 张" : "请先删除原现场视频再重新录制" },
        { status: 409 },
      );
    }

    const id = createCommerceId();
    await database.query(
      `INSERT INTO merchant_application_documents
        (id, user_id, kind, file_name, mime_type, file_size, content)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        id, user.id, kind, file.name.slice(0, 255), file.type, file.size,
        Buffer.from(await file.arrayBuffer()),
      ],
    );
    return NextResponse.json(
      { document: { id, kind, fileName: file.name, fileSize: file.size, mimeType: file.type } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Merchant document upload failed", error);
    return NextResponse.json({ message: "证明资料上传失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "请先登录" }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ message: "缺少文件编号" }, { status: 400 });

    const database = await ensureMerchantSchema();
    const application = await database.query<{ status: string }>(
      `SELECT a.status FROM merchant_application_documents d
         JOIN merchant_applications a ON a.id = d.application_id
        WHERE d.id = $1 AND d.user_id = $2 LIMIT 1`,
      [id, user.id],
    );
    if (application.rows[0] && application.rows[0].status !== "rejected") {
      return NextResponse.json({ message: "审核中或已通过的资料不能删除" }, { status: 409 });
    }

    const result = await database.query(
      "DELETE FROM merchant_application_documents WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, user.id],
    );
    if (!result.rows[0]) return NextResponse.json({ message: "文件不存在" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Merchant document delete failed", error);
    return NextResponse.json({ message: "删除资料失败" }, { status: 500 });
  }
}
