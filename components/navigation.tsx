"use client";

import type { LucideIcon } from "lucide-react";
import { Compass, Home, MessageSquare, ScanLine, UserRound } from "lucide-react";
import type { MainTab, View } from "../lib/data";
import { cn } from "./ui";

export function BottomNav({
  activeView,
  onNavigate,
}: {
  activeView: MainTab;
  onNavigate: (view: View) => void;
}) {
  const tabs: Array<{
    view: MainTab;
    label: string;
    icon: LucideIcon;
  }> = [
    { view: "home", label: "首页", icon: Home },
    { view: "discover", label: "发现", icon: Compass },
    { view: "scan", label: "扫一扫", icon: ScanLine },
    { view: "messages", label: "信息", icon: MessageSquare },
    { view: "profile", label: "我的", icon: UserRound },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 flex h-[72px] w-full max-w-[390px] -translate-x-1/2 items-end justify-around border-t border-slate-100 bg-white/95 px-2 pb-2 pt-2 shadow-[0_-6px_24px_rgba(90,105,120,0.08)] backdrop-blur">
      {tabs.map(({ view, label, icon: Icon }) => {
        const active = activeView === view;

        if (view === "scan") {
          return (
            <button
              key={view}
              type="button"
              onClick={() => onNavigate("scan")}
              className="flex min-w-[60px] flex-col items-center gap-1 text-[10px] text-slate-500"
            >
              <span className="-mt-8 flex size-[58px] items-center justify-center rounded-full bg-[#7189a1] text-white shadow-[0_8px_18px_rgba(94,116,139,0.3)] ring-4 ring-[#f4f6f8]">
                <Icon size={25} strokeWidth={1.8} />
              </span>
              <span>扫一扫</span>
            </button>
          );
        }

        return (
          <button
            key={view}
            type="button"
            onClick={() => onNavigate(view)}
            className={cn(
              "flex min-w-[56px] flex-col items-center gap-1 text-[10px] transition",
              active ? "text-[#667f99]" : "text-slate-400",
            )}
          >
            <Icon size={21} strokeWidth={active ? 2.3 : 1.8} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
