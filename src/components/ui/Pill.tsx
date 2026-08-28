import type { ReactNode } from "react";

type PillTone = "default" | "active" | "success" | "warning";

type PillProps = {
  tone?: PillTone;
  className?: string;
  children: ReactNode;
};

const toneClasses: Record<PillTone, string> = {
  default: "bg-cream text-ink/60 border border-ink/10",
  active: "bg-ink text-paper",
  success: "bg-leaf/15 text-leaf",
  warning: "bg-saffronSoft text-saffron",
};

export function Pill({ tone = "default", className = "", children }: PillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-extrabold ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
