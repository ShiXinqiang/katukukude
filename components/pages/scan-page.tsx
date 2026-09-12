"use client";

import { useState } from "react";
import { Camera, Flashlight, Info, ScanLine, ScanText, X, Zap } from "lucide-react";

export function ScanPage({ onBack }: { onBack: () => void }) {
  const [activeMode, setActiveMode] = useState("通用扫码");
  const modes = ["通用扫码", "AR识物", "翻译"];

  return (
    <main className="fixed inset-0 left-1/2 z-[60] w-full max-w-[390px] -translate-x-1/2 overflow-hidden bg-[#10161d] text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 size-72 rounded-full bg-[#627282]/55 blur-3xl" />
        <div className="absolute -right-28 top-48 size-80 rounded-full bg-[#4c5966]/70 blur-3xl" />
        <div className="absolute -bottom-24 left-16 size-72 rounded-full bg-[#74808b]/45 blur-3xl" />
        <div className="absolute inset-0 bg-[#0d141b]/55 backdrop-blur-[3px]" />
      </div>

      <div className="relative z-10 flex items-center justify-between px-4 pt-10">
        <button
          type="button"
          onClick={onBack}
          aria-label="关闭扫码"
          className="flex size-9 items-center justify-center rounded-full bg-black/25 text-white"
        >
          <X size={21} />
        </button>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full bg-black/25 text-white"
        >
          <Info size={19} />
        </button>
      </div>

      <div className="relative z-10 mt-9 flex justify-center">
        <div className="flex items-center gap-2 rounded-full bg-black/35 px-3.5 py-2 text-xs text-white/90 backdrop-blur focus-pulse">
          <Zap size={14} className="text-[#8db4d0]" />
          自动调焦中
        </div>
      </div>

      <div className="absolute left-1/2 top-[23%] z-10 -translate-x-1/2">
        <div className="relative h-[286px] w-[286px] rounded-[28px] border border-white/50">
          <span className="absolute -left-px -top-px h-9 w-9 rounded-tl-[28px] border-l-4 border-t-4 border-[#82abc7]" />
          <span className="absolute -right-px -top-px h-9 w-9 rounded-tr-[28px] border-r-4 border-t-4 border-[#82abc7]" />
          <span className="absolute -bottom-px -left-px h-9 w-9 rounded-bl-[28px] border-b-4 border-l-4 border-[#82abc7]" />
          <span className="absolute -bottom-px -right-px h-9 w-9 rounded-br-[28px] border-b-4 border-r-4 border-[#82abc7]" />

          <div className="absolute left-6 right-6 top-1/2 h-px animate-scan-line bg-[#82abc7] shadow-[0_0_18px_4px_rgba(130,171,199,0.8)]" />
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white/45">
            将二维码放入框内
          </div>
        </div>
      </div>

      <div className="absolute bottom-[145px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-8">
        {[
          { label: "手电筒", icon: Flashlight },
          { label: "相册/上传", icon: Camera },
          { label: "文本识别", icon: ScanText },
        ].map(({ label, icon: Icon }) => (
          <button
            type="button"
            key={label}
            className="flex w-16 flex-col items-center gap-2 text-[10px] text-white/80"
          >
            <span className="flex size-14 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
              <Icon size={22} strokeWidth={1.7} />
            </span>
            {label}
          </button>
        ))}
      </div>

      <div className="absolute bottom-9 left-1/2 z-10 flex -translate-x-1/2 rounded-full border border-white/15 bg-black/35 p-1">
        {modes.map((mode) => (
          <button
            type="button"
            key={mode}
            onClick={() => setActiveMode(mode)}
            className={`rounded-full px-4 py-2 text-xs transition ${
              activeMode === mode ? "bg-white/15 text-white" : "text-white/55"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </main>
  );
}
