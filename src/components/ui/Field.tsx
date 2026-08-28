import { cloneElement, forwardRef, isValidElement, useId, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Icon } from "../Icons";

export const inputClass =
  "focus-ring min-h-12 w-full rounded-2xl border border-ink/15 bg-paper px-4 text-[0.95rem] text-ink outline-none transition placeholder:text-ink/35 focus:border-teal";

type FieldProps = {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
};

export function Field({ label, children, error, hint, htmlFor, className = "" }: FieldProps) {
  const autoId = useId();
  const controlId = htmlFor ?? autoId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string; "aria-describedby"?: string }>, {
        id: (children as ReactElement<{ id?: string }>).props.id ?? controlId,
        "aria-describedby": describedBy,
      })
    : children;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={controlId} className="block text-sm font-extrabold text-ink">
        {label}
      </label>
      {control}
      {hint ? (
        <p id={hintId} className="text-xs font-semibold text-ink/55">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-extrabold text-coral">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className = "", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${inputClass} ${invalid ? "border-coral" : ""} ${className}`}
      {...props}
    />
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className = "", ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${inputClass} py-3 ${invalid ? "border-coral" : ""} ${className}`}
      {...props}
    />
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid = false, className = "", children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={`${inputClass} appearance-none pr-10 ${invalid ? "border-coral" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
      <Icon name="chevron" size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/50" />
    </div>
  );
});
