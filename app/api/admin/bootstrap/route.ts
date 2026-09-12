import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  createSession,
  createUserId,
  ensureAuthSchema,
  hashPassword,
  isValidUsername,
  normalizeUsername,
  setSessionCookie,
  toAuthUser,
} from "../../../../lib/auth";

export const dynamic = "force-dynamic";

type BootstrapUserRow = {
  id: string;
  username: string;
  display_name: string;
  role: string;
  password_hash: string;
  created_at: Date | string;
};

function matchesSecret(provided: unknown, expected: string) {
  if (typeof provided !== "string") return false;

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export async function POST(request: Request) {
  const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { message: "数据库未配置，请联系管理员" },
      { status: 503 },
    );
  }

  if (!expectedToken) {
    return NextResponse.json(
      { message: "管理员初始化未开启，请先配置 ADMIN_BOOTSTRAP_TOKEN" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      token?: unknown;
      username?: unknown;
      password?: unknown;
      displayName?: unknown;
    };

    if (!matchesSecret(body.token, expectedToken)) {
      return NextResponse.json({ message: "初始化口令不正确" }, { status: 403 });
    }

    const username = normalizeUsername(body.username);
    const password = typeof body.password === "string" ? body.password : "";
    const displayName =
      typeof body.displayName === "string" && body.displayName.trim()
        ? body.displayName.trim().slice(0, 80)
        : username;

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { message: "账号需为 3-64 位字母、数字、下划线、点、@ 或短横线" },
        { status: 400 },
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { message: "密码长度需为 8-128 位" },
        { status: 400 },
      );
    }

    const database = await ensureAuthSchema();
    const client = await database.connect();
    let user: BootstrapUserRow;

    try {
      await client.query("BEGIN");

      const adminCount = await client.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM users WHERE role = 'admin'",
      );

      if (Number(adminCount.rows[0]?.count ?? 0) > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { message: "管理员已初始化，请直接登录" },
          { status: 409 },
        );
      }

      const passwordHash = await hashPassword(password);
      const existing = await client.query<{ id: string }>(
        "SELECT id FROM users WHERE username = $1 LIMIT 1",
        [username],
      );

      if (existing.rows[0]) {
        const updated = await client.query<BootstrapUserRow>(
          `UPDATE users
           SET display_name = $2, role = 'admin', password_hash = $3
           WHERE id = $1
           RETURNING id, username, display_name, role, password_hash, created_at`,
          [existing.rows[0].id, displayName, passwordHash],
        );
        user = updated.rows[0];
      } else {
        const created = await client.query<BootstrapUserRow>(
          `INSERT INTO users (id, username, display_name, role, password_hash)
           VALUES ($1, $2, $3, 'admin', $4)
           RETURNING id, username, display_name, role, password_hash, created_at`,
          [createUserId(), username, displayName, passwordHash],
        );
        user = created.rows[0];
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const sessionToken = await createSession(user.id);
    setSessionCookie(sessionToken);

    return NextResponse.json({ user: toAuthUser(user) }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { message: "该账号已存在，请直接登录或更换账号" },
        { status: 409 },
      );
    }

    console.error("Admin bootstrap failed", error);
    return NextResponse.json(
      { message: "管理员初始化失败，请稍后重试" },
      { status: 500 },
    );
  }
}
