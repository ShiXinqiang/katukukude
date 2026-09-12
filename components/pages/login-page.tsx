"use client";

import { useState, type FormEvent } from "react";
import { Check, LockKeyhole, UserRound, X } from "lucide-react";
import type { AuthUser } from "../../lib/data";

export function LoginPage({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (user: AuthUser) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!agreed) {
      setError("请先同意用户协议和隐私政策");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
          displayName: isRegister ? displayName : undefined,
        }),
      });
      const result = (await response.json()) as {
        user?: AuthUser;
        message?: string;
      };

      if (!response.ok || !result.user) {
        throw new Error(result.message || "操作失败，请稍后重试");
      }

      onSuccess(result.user);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "操作失败，请稍后重试",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-white px-6 pb-7 pt-9">
      <button
        type="button"
        onClick={onBack}
        aria-label="返回"
        className="flex size-9 items-center justify-center rounded-full bg-[#f2f5f6] text-slate-600"
      >
        <X size={19} />
      </button>

      <section className="mt-16">
        <p className="text-sm font-medium text-[#7189a1]">欢迎来到卡兔</p>
        <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight text-slate-800">
          {isRegister ? "创建账号" : "欢迎回来"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          {isRegister
            ? "注册后即可保存个人资料和后续业务数据"
            : "使用账号和密码登录卡兔服务导航"}
        </p>
      </section>

      <form className="mt-10 space-y-3" onSubmit={submit}>
        {isRegister && (
          <label className="flex items-center rounded-2xl bg-[#f5f7f8] px-4 py-4">
            <UserRound size={19} className="mr-3 text-slate-400" />
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="显示名称（可选）"
              maxLength={80}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>
        )}

        <label className="flex items-center rounded-2xl bg-[#f5f7f8] px-4 py-4">
          <UserRound size={19} className="mr-3 text-slate-400" />
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="请输入账号"
            maxLength={64}
            required
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </label>

        <label className="flex items-center rounded-2xl bg-[#f5f7f8] px-4 py-4">
          <LockKeyhole size={19} className="mr-3 text-slate-400" />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder={isRegister ? "设置密码（至少 8 位）" : "请输入密码"}
            minLength={8}
            maxLength={128}
            required
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </label>

        {isRegister && (
          <label className="flex items-center rounded-2xl bg-[#f5f7f8] px-4 py-4">
            <LockKeyhole size={19} className="mr-3 text-slate-400" />
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="再次确认密码"
              minLength={8}
              maxLength={128}
              required
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>
        )}

        {error && (
          <p className="rounded-xl bg-[#fff1ee] px-3 py-2.5 text-xs leading-5 text-[#c9685d]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-3 h-12 w-full rounded-full bg-[#7189a1] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(104,130,153,0.22)] transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "提交中..." : isRegister ? "注册并登录" : "登录"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(isRegister ? "login" : "register");
          setError("");
        }}
        className="mx-auto mt-5 text-xs text-[#7189a1]"
      >
        {isRegister ? "已有账号？返回登录" : "还没有账号？立即注册"}
      </button>

      <div className="mt-auto">
        <button
          type="button"
          onClick={() => setAgreed((value) => !value)}
          className="mx-auto mt-9 flex items-center gap-2 text-[11px] text-slate-400"
        >
          <span
            className={`flex size-4 items-center justify-center rounded border ${
              agreed
                ? "border-[#7189a1] bg-[#7189a1] text-white"
                : "border-slate-300"
            }`}
          >
            {agreed && <Check size={12} />}
          </span>
          我已阅读并同意
          <span className="text-[#7189a1]">用户协议</span>和
          <span className="text-[#7189a1]">隐私政策</span>
        </button>
      </div>
    </main>
  );
}
