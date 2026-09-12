"use client";

import { BellRing, Gift, Heart, MessageCircle, MoreHorizontal, TicketPercent, Truck } from "lucide-react";
import { messageItems, messageTypes } from "../../lib/data";

export function MessagesPage() {
  return (
    <main className="min-h-screen overflow-hidden pb-28">
      <header className="px-4 pb-2 pt-7">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold tracking-tight text-slate-800">
            消息
          </h1>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm"
          >
            <MoreHorizontal size={19} />
          </button>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-3 gap-3 px-4">
        {messageTypes.map(({ title, count, icon: Icon, tone }) => (
          <button
            type="button"
            key={title}
            className="flex flex-col items-center rounded-2xl bg-white py-4 shadow-sm"
          >
            <span className={`relative flex size-14 items-center justify-center rounded-full ${tone}`}>
              <Icon size={24} strokeWidth={1.8} />
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#df7066] text-[10px] font-semibold text-white">
                {count}
              </span>
            </span>
            <span className="mt-2 text-[11px] text-slate-600">{title}</span>
          </button>
        ))}
      </section>

      <section className="mt-6 px-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {messageItems.map((message, index) => {
            const Icon = message.icon;

            return (
              <button
                type="button"
                key={message.name}
                className={`flex w-full items-center gap-3 px-3.5 py-4 text-left ${
                  index !== messageItems.length - 1
                    ? "border-b border-slate-100"
                    : ""
                }`}
              >
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${message.tone}`}>
                  <Icon size={21} strokeWidth={1.8} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-slate-800">
                      {message.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-400">
                      {message.time}
                      {message.unread && (
                        <i className="ml-1.5 inline-block size-1.5 rounded-full bg-[#7895b0] align-middle" />
                      )}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-xs leading-5 text-slate-400">
                    {message.preview}
                  </span>
                  <span className="block truncate text-xs leading-5 text-slate-400">
                    点击查看详情与后续进度
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
