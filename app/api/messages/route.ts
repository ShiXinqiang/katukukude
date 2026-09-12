import { NextResponse } from "next/server";
import { ensureAdminSchema } from "../../../lib/admin";
import { getCurrentUser } from "../../../lib/auth";

export const dynamic = "force-dynamic";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  content: string;
  readAt: Date | string | null;
  createdAt: Date | string;
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "请先登录" }, { status: 401 });
    }

    const database = await ensureAdminSchema();
    const result = await database.query<NotificationRow>(
      `SELECT id,
              type,
              title,
              content,
              read_at AS "readAt",
              created_at AS "createdAt"
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [user.id],
    );

    return NextResponse.json({
      messages: result.rows.map((message) => ({
        ...message,
        createdAt: new Date(message.createdAt).toISOString(),
        readAt: message.readAt
          ? new Date(message.readAt).toISOString()
          : null,
      })),
    });
  } catch (error) {
    console.error("Message list failed", error);
    return NextResponse.json(
      { message: "消息加载失败" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "请先登录" }, { status: 401 });
    }

    const body = (await request.json()) as { id?: unknown; all?: unknown };
    const database = await ensureAdminSchema();

    if (body.all === true) {
      await database.query(
        "UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE user_id = $1",
        [user.id],
      );
    } else if (typeof body.id === "string" && body.id) {
      await database.query(
        "UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE id = $1 AND user_id = $2",
        [body.id, user.id],
      );
    } else {
      return NextResponse.json({ message: "缺少消息 ID" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Message update failed", error);
    return NextResponse.json(
      { message: "消息状态更新失败" },
      { status: 500 },
    );
  }
}
