import { forwardRef, type HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, className = "", children, ...props },
  ref,
) {
  const interactiveClasses = interactive
    ? "transition hover:-translate-y-0.5 hover:shadow-lift hover:border-teal focus-ring focus-visible:outline-focus"
    : "";
  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-ink/15 bg-paper shadow-card ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
