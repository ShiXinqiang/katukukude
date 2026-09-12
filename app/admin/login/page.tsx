"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { AuthUser } from "../../../lib/data";

export default function AdminLoginPage() {
  const [setupOpen, setSetupOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const result = (await response.json()) as {
        user?: AuthUser;
        message?: string;
      };

      if (!response.ok || !result.user) {
        throw new Error(result.message || "登录失败，请检查账号和密码");
      }

      if (result.user.role !== "admin") {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        throw new Error("该账号没有管理员权限");
      }

      window.location.assign("/admin");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "登录失败，请稍后重试",
      );
    } finally {
      setLoading(false);
    }
  };

  const submitBootstrap = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: setupToken,
          username,
          displayName,
          password,
        }),
      });
      const result = (await response.json()) as {
        user?: AuthUser;
        message?: string;
      };

      if (!response.ok || !result.user) {
        throw new Error(result.message || "初始化失败，请稍后重试");
      }

      window.location.assign("/admin");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "初始化失败，请稍后重试",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#e8eef2] px-4 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1080px] items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[28px] bg-white shadow-[0_18px_60px_rgba(82,105,123,0.14)] md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative hidden overflow-hidden bg-[#6f86a1] p-10 text-white md:block">
            <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10" />
            <div className="absolute -bottom-28 -left-8 size-64 rounded-full bg-[#536d88]/40" />
            <div className="relative flex h-full min-h-[560px] flex-col">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck size={20} />
                卡兔管理后台
              </div>
              <div className="relative mt-auto">
                <p className="text-sm text-white/65">Operations Console</p>
                <h1 className="mt-3 text-4xl font-bold leading-tight">
                  管理每一条<br />真实业务数据
                </h1>
                <p className="mt-5 max-w-xs text-sm leading-6 text-white/70">
                  统一查看用户、订单和通知，重要付款操作都会记录并通知用户。
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-slate-600"
            >
              <ArrowLeft size={15} />
              返回主站
            </Link>

            <div className="mt-12 flex items-center gap-3 md:mt-16">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#e8eef2] text-[#7189a1]">
                <ShieldCheck size={25} strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-xs font-medium text-[#7189a1]">安全登录</p>
                <h2 className="mt-1 text-2xl font-bold">管理员登录</h2>
              </div>
            </div>

            <form className="mt-8 space-y-3" onSubmit={setupOpen ? submitBootstrap : submitLogin}>
              {setupOpen && (
                <label className="flex items-center rounded-2xl bg-[#f4f7f8] px-4 py-3.5">
                  <KeyRound size={18} className="mr-3 text-slate-400" />
                  <input
                    value={setupToken}
                    onChange={(event) => setSetupToken(event.target.value)}
                    type="password"
                    placeholder="ADMIN_BOOTSTRAP_TOKEN"
                    required
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </label>
              )}

              {setupOpen && (
                <label className="flex items-center rounded-2xl bg-[#f4f7f8] px-4 py-3.5">
                  <UserRound size={18} className="mr-3 text-slate-400" />
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="管理员名称（可选）"
                    maxLength={80}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </label>
              )}

              <label className="flex items-center rounded-2xl bg-[#f4f7f8] px-4 py-3.5">
                <UserRound size={18} className="mr-3 text-slate-400" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="管理员账号"
                  maxLength={64}
                  required
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </label>

              <label className="flex items-center rounded-2xl bg-[#f4f7f8] px-4 py-3.5">
                <LockKeyhole size={18} className="mr-3 text-slate-400" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete={setupOpen ? "new-password" : "current-password"}
                  placeholder={setupOpen ? "设置密码（至少 8 位）" : "管理员密码"}
                  minLength={8}
                  maxLength={128}
                  required
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </label>

              {error && (
                <p className="rounded-xl bg-[#fff1ee] px-3 py-2.5 text-xs leading-5 text-[#c9685d]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 h-12 w-full rounded-full bg-[#7189a1] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(104,130,153,0.22)] transition hover:bg-[#627b94] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "处理中..." : setupOpen ? "初始化管理员" : "进入后台"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setSetupOpen((open) => !open);
                setError("");
              }}
              className="mx-auto mt-5 block text-xs text-[#7189a1]"
            >
              {setupOpen ? "已有管理员？返回登录" : "首次使用？初始化管理员"}
            </button>

            {setupOpen && (
              <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">
                初始化口令来自 Railway 的 ADMIN_BOOTSTRAP_TOKEN，初始化成功后可删除该环境变量。
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
