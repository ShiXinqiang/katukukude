import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ensureAdminSchema, getCurrentAdmin } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

type BroadcastRow = {
  id: string;
  title: string;
  content: string;
  recipientCount: number;
  createdAt: Date | string;
};

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ message: "需要管理员权限" }, { status: 401 });
    }

    const database = await ensureAdminSchema();
    const result = await database.query<BroadcastRow>(
      `SELECT id,
              title,
              content,
              recipient_count AS "recipientCount",
              created_at AS "createdAt"
       FROM broadcasts
       ORDER BY created_at DESC
       LIMIT 50`,
    );

    return NextResponse.json({
      broadcasts: result.rows.map((broadcast) => ({
        ...broadcast,
        createdAt: new Date(broadcast.createdAt).toISOString(),
      })),
    });
  } catch (error) {
    console.error("Admin broadcast list failed", error);
    return NextResponse.json(
      { message: "广播记录加载失败" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ message: "需要管理员权限" }, { status: 401 });
    }

    const body = (await request.json()) as {
      title?: unknown;
      content?: unknown;
    };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!title || title.length > 160) {
      return NextResponse.json(
        { message: "广播标题为 1-160 个字符" },
        { status: 400 },
      );
    }

    if (!content || content.length > 5000) {
      return NextResponse.json(
        { message: "广播内容为 1-5000 个字符" },
        { status: 400 },
      );
    }

    const database = await ensureAdminSchema();
    const client = await database.connect();

    try {
      await client.query("BEGIN");
      const recipientResult = await client.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM users",
      );
      const recipientCount = Number(recipientResult.rows[0]?.count ?? 0);
      const broadcastId = randomUUID();

      const created = await client.query<BroadcastRow>(
        `INSERT INTO broadcasts
           (id, title, content, recipient_count, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, title, content,
                   recipient_count AS "recipientCount",
                   created_at AS "createdAt"`,
        [broadcastId, title, content, recipientCount, admin.id],
      );

      if (recipientCount > 0) {
        await client.query(
          `INSERT INTO notifications (id, user_id, type, title, content)
           SELECT md5(random()::text || clock_timestamp()::text || u.id),
                  u.id,
                  'system',
                  $1,
                  $2
           FROM users u`,
          [title, content],
        );
      }

      await client.query("COMMIT");
      const broadcast = created.rows[0];
      return NextResponse.json(
        {
          broadcast: {
            ...broadcast,
            createdAt: new Date(broadcast.createdAt).toISOString(),
          },
        },
        { status: 201 },
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Admin broadcast creation failed", error);
    return NextResponse.json(
      { message: "全员广播发送失败" },
      { status: 500 },
    );
  }
}
