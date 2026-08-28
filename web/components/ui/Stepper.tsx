import { Icon } from "../Icons";

type StepperProps = {
  stages: string[];
  current: number;
  className?: string;
};

export function Stepper({ stages, current, className = "" }: StepperProps) {
  const clamped = Math.max(0, Math.min(current, stages.length - 1));
  return (
    <ol
      className={`flex items-center gap-1.5 ${className}`}
      aria-label={`Progress: step ${clamped + 1} of ${stages.length}`}
    >
      {stages.map((stage, index) => {
        const isComplete = index < clamped;
        const isCurrent = index === clamped;
        const stateClasses = isComplete
          ? "bg-teal text-paper"
          : isCurrent
            ? "bg-teal text-paper ring-4 ring-teal/20"
            : "bg-ink/10 text-ink/40";
        return (
          <li key={stage} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              aria-current={isCurrent ? "step" : undefined}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-extrabold transition-colors ${stateClasses}`}
            >
              {isComplete ? <Icon name="check" size={16} strokeWidth={3} /> : <span className="text-xs">{index + 1}</span>}
            </span>
            <span className="sr-only">{stage}</span>
            <span
              aria-hidden="true"
              className={`hidden truncate text-[0.7rem] font-bold uppercase tracking-[0.1em] sm:block ${
                isCurrent ? "text-ink" : "text-ink/45"
              }`}
            >
              {stage}
            </span>
            {index < stages.length - 1 ? (
              <span
                aria-hidden="true"
                className={`ml-1 hidden h-1 flex-1 rounded-full sm:block ${
                  index < clamped ? "bg-teal" : "bg-ink/10"
                }`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
