import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth";
import { ensureMerchantSchema } from "../../../../../../lib/merchant";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "请先登录" }, { status: 401 });
    const database = await ensureMerchantSchema();
    const result = await database.query<{
      user_id: string; file_name: string; mime_type: string; content: Buffer;
    }>(
      "SELECT user_id, file_name, mime_type, content FROM merchant_application_documents WHERE id = $1 LIMIT 1",
      [params.id],
    );
    const document = result.rows[0];
    if (!document || (document.user_id !== user.id && user.role !== "admin")) {
      return NextResponse.json({ message: "文件不存在" }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(document.content), {
      headers: {
        "Content-Type": document.mime_type,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.file_name)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Merchant document read failed", error);
    return NextResponse.json({ message: "文件读取失败" }, { status: 500 });
  }
}
