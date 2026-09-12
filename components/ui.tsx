import type { LucideIcon } from "lucide-react";
import { ChevronRight, Image as ImageIcon } from "lucide-react";

export const cn = (
  ...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(" ");

export function SkeletonImage({
  className,
  label = "图片占位",
  compact = false,
}: {
  className?: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-slate-200", className)}>
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300" />
      <div className="relative flex h-full w-full items-center justify-center gap-1 text-slate-500/70">
        <ImageIcon size={compact ? 15 : 18} strokeWidth={1.6} />
        {!compact && <span className="text-[10px]">{label}</span>}
      </div>
    </div>
  );
}

export function SectionHeader({
  title,
  onViewAll,
}: {
  title: string;
  onViewAll?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[17px] font-bold tracking-tight text-slate-800">
        {title}
      </h2>
      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-xs text-slate-400"
        >
          查看全部
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

export function IconListRow({
  icon: Icon,
  label,
  onClick,
  divider = true,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  divider?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-4 text-left",
        divider && "border-b border-slate-100",
      )}
    >
      <Icon size={19} className="text-[#7890a6]" />
      <span className="flex-1 text-sm text-slate-700">{label}</span>
      <ChevronRight size={17} className="text-slate-300" />
    </button>
  );
}
