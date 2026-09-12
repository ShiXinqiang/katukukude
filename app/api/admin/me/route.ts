import { NextResponse } from "next/server";
import { getCurrentAdmin } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ message: "需要管理员权限" }, { status: 401 });
    }

    return NextResponse.json({ user: admin });
  } catch (error) {
    console.error("Admin session lookup failed", error);
    return NextResponse.json({ message: "管理员会话校验失败" }, { status: 500 });
  }
}
