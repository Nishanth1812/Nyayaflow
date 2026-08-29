import type { TimelineEvent } from "../lib/mockApi";
import { Icon } from "./Icons";

type TimelineProps = { events: TimelineEvent[] };

export function Timeline({ events }: TimelineProps) {
  return (
    <ol className="relative space-y-5 before:absolute before:bottom-6 before:left-5 before:top-6 before:w-0.5 before:rounded-full before:bg-ink/10 md:flex md:space-y-0 md:before:bottom-auto md:before:left-6 md:before:right-6 md:before:top-6 md:before:h-0.5 md:before:w-auto">
      {events.map((event) => (
        <li key={event.key} className="relative flex gap-4 md:min-w-0 md:flex-1 md:flex-col md:gap-3 md:pr-4 last:md:pr-0">
          <span
            className={`z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-paper ${
              event.state === "current"
                ? "bg-teal text-paper ring-4 ring-teal/20"
                : event.state === "complete"
                  ? "bg-teal text-paper"
                  : "bg-mist text-ink/40"
            }`}
          >
            {event.state === "complete" ? (
              <Icon name="check" size={16} strokeWidth={3} />
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-current" />
            )}
          </span>
          <div className="pb-1 md:pr-2">
            <p className={`text-sm font-bold tracking-[-0.01em] $              {event.state === "current" ? "text-teal" : "text-ink"}`}>
              {event.label}
              {event.state === "current" ? (
                <span className="ml-2 rounded-full bg-teal/15 px-2 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.1em] text-teal">now</span>
              ) : null}
            </p>
            <p className="mt-1 text-sm font-semibold leading-5 text-ink/55">{event.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
