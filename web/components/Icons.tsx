export type IconName =
  | "arrow"
  | "check"
  | "chevron"
  | "mic"
  | "shield"
  | "spark"
  | "upload"
  | "warning"
  | "x"
  | "document"
  | "phone"
  | "gavel"
  | "rupee"
  | "clock"
  | "celebrate"
  | "home"
  | "search"
  | "leaf";

type IconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function Icon({ name, size = 20, strokeWidth = 2, className = "" }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };

  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m7 10 5 5 5-5" />,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    spark: <><path d="m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3Z" /><path d="m19 16 .5 2.5L22 19l-2.5.5L19 22l-.5-2.5L16 19l2.5-.5L19 16Z" /></>,
    upload: <><path d="M12 16V4m0 0L8 8m4-4 4 4" /><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></>,
    warning: <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v5m0 3h.01" /></>,
    x: <path d="m6 6 12 12M18 6 6 18" />,
    document: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
    phone: <path d="M5 4h3l2 5-2 1c1 2 3 4 5 5l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
    gavel: <><path d="m14 4 6 6-3 3-6-6 3-3Z" /><path d="m11 7-7 7 3 3 7-7" /><path d="M5 21h9" /></>,
    rupee: <><path d="M7 4h9l-5 8h5" /><path d="M7 12h4M7 16h9M7 20h9" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    celebrate: <><path d="M12 3v6m0 0 3-3m-3 3L9 6" /><path d="M5 13a7 7 0 0 0 14 0" /><path d="M9 20h6" /></>,
    home: <path d="m4 11 8-7 8 7M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    leaf: <><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14Z" /><path d="M5 19c4-4 8-6 12-7" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}
