import { useState } from "react";
import type { Dictionary, ResolutionKey } from "../lib/i18n";
import { createAppeal, type OfficialStatus } from "../lib/mockApi";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Textarea } from "./ui/Field";
import { Icon, type IconName } from "./Icons";
import { StepHeading } from "./StepHeading";

type ResolutionStepProps = {
  complaint: string;
  department: string;
  status: OfficialStatus;
  referenceNumber: string;
  dictionary: Dictionary;
  outcome: ResolutionKey | undefined;
  onOutcome: (outcome: ResolutionKey) => void;
  serverAppeal?: string | null;
};

const optionIcons: Record<ResolutionKey, IconName> = {
  yes: "shield",
  partial: "leaf",
  no: "warning",
  wrong_dept: "gavel",
  help: "spark",
};

export function ResolutionStep({ complaint, department, status, referenceNumber, dictionary, outcome, onOutcome, serverAppeal }: ResolutionStepProps) {
  const [editedAppeal, setEditedAppeal] = useState<string | null>(null);
  const shouldAppeal = outcome === "no" || outcome === "wrong_dept";
  const generatedAppeal = shouldAppeal
    ? createAppeal({
        originalComplaint: complaint,
        department,
        status,
        referenceNumber,
        missingRemedy:
          outcome === "wrong_dept"
            ? "This complaint needs to be reviewed by the correct department."
            : "The pending PM-KISAN instalment is still not credited.",
      })
    : "";
  const displayAppeal = editedAppeal ?? serverAppeal ?? generatedAppeal;

  return (
    <div className="mx-auto max-w-2xl">
      <StepHeading eyebrow={dictionary.resolution.eyebrow} title={dictionary.resolution.title} intro={dictionary.resolution.intro} />

      <div className="space-y-3">
        {dictionary.resolution.options.map((option) => {
          const selected = outcome === option.key;
          return (
            <Card
              key={option.key}
              interactive
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              onClick={() => {
                setEditedAppeal(null);
                onOutcome(option.key);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setEditedAppeal(null);
                  onOutcome(option.key);
                }
              }}
              className={`flex min-h-[4.5rem] cursor-pointer items-center gap-3 p-4 ${selected ? "border-teal bg-moss" : ""}`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${selected ? "bg-teal text-paper" : "bg-mist text-teal"}`}
                aria-hidden="true"
              >
                <Icon name={optionIcons[option.key]} size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold text-ink">{option.label}</span>
                <span className="mt-1 block text-sm font-semibold leading-5 text-ink/55">{option.helper}</span>
              </span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  selected ? "border-teal bg-teal text-paper" : "border-ink/20 text-transparent"
                }`}
                aria-hidden="true"
              >
                <Icon name="check" size={16} strokeWidth={3} />
              </span>
            </Card>
          );
        })}
      </div>

      {shouldAppeal ? (
        <Card className="mt-5 border-saffron/30 bg-saffronSoft p-4 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.13em] text-ink">
            <Icon name="warning" size={18} /> {dictionary.resolution.appealTitle}
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/65">{dictionary.resolution.appealHint}</p>
          <Textarea
            aria-label={dictionary.resolution.appealTitle}
            value={displayAppeal}
            onChange={(event) => setEditedAppeal(event.target.value)}
            rows={12}
            className="focus-ring mt-4 w-full resize-y rounded-2xl border border-saffron/25 bg-paper px-4 py-3 text-sm leading-6 text-ink outline-none focus:border-saffron"
          />
        </Card>
      ) : null}

      {outcome === "yes" || outcome === "partial" ? (
        <Card className="mt-5 border-teal/25 bg-moss p-5">
          <div className="flex items-center gap-2 text-teal">
            <Icon name="shield" size={20} />
            <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">{dictionary.resolution.successTitle}</h2>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/65">{dictionary.resolution.successBody}</p>
        </Card>
      ) : null}

      {outcome === "help" ? (
        <Card className="mt-5 border-ink/15 bg-cream p-5">
          <div className="flex items-center gap-2 text-teal">
            <Icon name="spark" size={20} />
            <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">{dictionary.submission.explanationLabel}</h2>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/70">{dictionary.resolution.helpBody}</p>
        </Card>
      ) : null}
    </div>
  );
}
