import { NextResponse } from "next/server";
import {
  createSession,
  ensureAuthSchema,
  isValidUsername,
  normalizeUsername,
  setSessionCookie,
  toAuthUser,
  verifyPassword,
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
    };
    const username = normalizeUsername(body.username);
    const password = typeof body.password === "string" ? body.password : "";

    if (!isValidUsername(username) || password.length === 0) {
      return NextResponse.json(
        { message: "账号或密码不正确" },
        { status: 401 },
      );
    }

    const database = await ensureAuthSchema();
    const result = await database.query<{
      id: string;
      username: string;
      display_name: string;
      role: string;
      password_hash: string;
      created_at: Date | string;
    }>(
      `SELECT id, username, display_name, role, password_hash, created_at
       FROM users WHERE username = $1 LIMIT 1`,
      [username],
    );
    const user = result.rows[0];

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json(
        { message: "账号或密码不正确" },
        { status: 401 },
      );
    }

    const token = await createSession(user.id);
    setSessionCookie(token);

    return NextResponse.json({ user: toAuthUser(user) });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json(
      { message: "登录失败，请稍后重试" },
      { status: 500 },
    );
  }
}
