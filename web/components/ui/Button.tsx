import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "accent" | "ghost" | "soft";
type ButtonSize = "lg" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper hover:bg-teal",
  accent: "bg-coral text-paper hover:brightness-105",
  ghost: "border border-ink/15 text-ink hover:border-teal",
  soft: "bg-tealSoft text-teal hover:bg-moss",
};

const sizeClasses: Record<ButtonSize, string> = {
  lg: "min-h-14 text-base px-6",
  md: "min-h-12 text-sm px-5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "lg", fullWidth = true, leftIcon, rightIcon, className = "", type = "button", children, ...props },
  ref,
) {
  const widthClass = fullWidth ? "w-full sm:w-auto" : "";
  return (
    <button
      ref={ref}
      type={type}
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {leftIcon ? <span className="shrink-0" aria-hidden="true">{leftIcon}</span> : null}
      {children}
      {rightIcon ? <span className="shrink-0" aria-hidden="true">{rightIcon}</span> : null}
    </button>
  );
});
