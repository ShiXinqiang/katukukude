"use client";

import { useState } from "react";
import { Check, MessageCircle, Phone, WalletCards, X } from "lucide-react";

export function LoginPage({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [agreed, setAgreed] = useState(false);

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
          登录后
          <br />
          开始探索生活
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          一个账号，连接本地生活与精选好物
        </p>
      </section>

      <section className="mt-12 space-y-3">
        <label className="flex items-center rounded-2xl bg-[#f5f7f8] px-4 py-4">
          <Phone size={19} className="mr-3 text-slate-400" />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="tel"
            placeholder="请输入手机号"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </label>

        <label className="flex items-center rounded-2xl bg-[#f5f7f8] px-4 py-4">
          <MessageCircle size={19} className="mr-3 text-slate-400" />
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            placeholder="请输入验证码"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <button type="button" className="shrink-0 text-xs font-medium text-[#7189a1]">
            获取验证码
          </button>
        </label>

        <button
          type="button"
          disabled={!agreed || phone.length < 4 || code.length < 2}
          onClick={onSuccess}
          className="mt-3 h-12 w-full rounded-full bg-[#7189a1] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(104,130,153,0.22)] transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          登录
        </button>
      </section>

      <div className="mt-auto">
        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-slate-100" />
          <span className="text-xs text-slate-400">其他方式登录</span>
          <span className="h-px flex-1 bg-slate-100" />
        </div>

        <div className="mt-5 flex justify-center gap-8">
          <button type="button" className="flex size-11 items-center justify-center rounded-full bg-[#e5f0e8] text-[#6f927b]">
            <MessageCircle size={22} />
          </button>
          <button type="button" className="flex size-11 items-center justify-center rounded-full bg-[#f4e8df] text-[#bc846d]">
            <WalletCards size={22} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setAgreed((value) => !value)}
          className="mx-auto mt-7 flex items-center gap-2 text-[11px] text-slate-400"
        >
          <span className={`flex size-4 items-center justify-center rounded border ${agreed ? "border-[#7189a1] bg-[#7189a1] text-white" : "border-slate-300"}`}>
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
