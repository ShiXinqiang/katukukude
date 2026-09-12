import { NextResponse } from "next/server";
import {
  createSession,
  createUserId,
  ensureAuthSchema,
  hashPassword,
  isValidUsername,
  normalizeUsername,
  setSessionCookie,
} from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { message: "数据库未配置，请联系管理员" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      username?: unknown;
      password?: unknown;
      displayName?: unknown;
    };
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
    const existing = await database.query<{ id: string }>(
      "SELECT id FROM users WHERE username = $1 LIMIT 1",
      [username],
    );

    if (existing.rows[0]) {
      return NextResponse.json(
        { message: "该账号已注册，请直接登录" },
        { status: 409 },
      );
    }

    const user = {
      id: createUserId(),
      username,
      displayName,
      passwordHash: await hashPassword(password),
    };

    await database.query(
      `INSERT INTO users (id, username, display_name, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [user.id, user.username, user.displayName, user.passwordHash],
    );

    const token = await createSession(user.id);
    setSessionCookie(token);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { message: "该账号已注册，请直接登录" },
        { status: 409 },
      );
    }

    console.error("Registration failed", error);
    return NextResponse.json(
      { message: "注册失败，请稍后重试" },
      { status: 500 },
    );
  }
}
