import type { Dictionary } from "../lib/i18n";
import type { EvidenceScore, EvidenceState } from "../lib/mockApi";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Icon, type IconName } from "./Icons";
import { Pill } from "./ui/Pill";
import { StepHeading } from "./StepHeading";

type EvidenceKey = keyof EvidenceState;

const itemIcons: Record<EvidenceKey, IconName> = {
  beneficiaryId: "document",
  paymentDates: "clock",
  paymentScreenshot: "upload",
  bankReference: "rupee",
};

type EvidenceStepProps = {
  evidence: EvidenceState;
  score: EvidenceScore;
  dictionary: Dictionary;
  onToggle: (key: EvidenceKey) => void;
  onMockUpload: () => void;
  onContinue: () => void;
};

function strengthTone(percentage: number) {
  if (percentage >= 75) return "success" as const;
  if (percentage >= 40) return "warning" as const;
  return "default" as const;
}

function strengthCopy(percentage: number, dictionary: Dictionary) {
  if (percentage >= 75) return dictionary.evidence.complete;
  return dictionary.evidence.needed;
}

export function EvidenceStep({ evidence, score, dictionary, onToggle, onMockUpload, onContinue }: EvidenceStepProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <StepHeading eyebrow={dictionary.evidence.eyebrow} title={dictionary.evidence.title} intro={dictionary.evidence.intro} />

      <Card className="bg-mist p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-teal">{dictionary.evidence.scoreLabel}</p>
            <p className="mt-1 text-3xl font-extrabold tracking-[-0.01em] text-ink">{score.percentage}%</p>
          </div>
          <Pill tone={strengthTone(score.percentage)}>
            {score.completed} / {score.total} {strengthCopy(score.percentage, dictionary)}
          </Pill>
        </div>
        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-ink/10"
          role="progressbar"
          aria-label={dictionary.evidence.scoreLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score.percentage}
        >
          <div
            className={`h-full rounded-full transition-all ${score.percentage >= 75 ? "bg-leaf" : "bg-saffron"}`}
            style={{ width: `${score.percentage}%` }}
          />
        </div>
      </Card>

      <div className="mt-5 space-y-3">
        {dictionary.evidence.items.map((item) => {
          const key = item.key as EvidenceKey;
          const isComplete = evidence[key];
          const isScreenshot = key === "paymentScreenshot";
          const icon = itemIcons[key];
          return (
            <Card key={key} interactive={false} className="flex min-h-[4.5rem] items-center gap-3 p-4">
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isComplete ? "bg-teal text-paper" : "bg-mist text-teal"}`}
                aria-hidden="true"
              >
                <Icon name={icon} size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-extrabold text-ink">{item.label}</span>
                <span className="mt-1 block text-sm font-semibold leading-5 text-ink/55">
                  {isComplete && isScreenshot ? dictionary.evidence.attached : item.helper}
                </span>
              </span>
              <Button
                type="button"
                onClick={() => {
                  onToggle(key);
                  if (isScreenshot && !isComplete) onMockUpload();
                }}
                aria-pressed={isComplete}
                aria-label={isScreenshot && !isComplete ? dictionary.evidence.upload : item.label}
                fullWidth={false}
                className={`focus-ring inline-flex min-h-12 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-extrabold transition active:scale-[0.98] ${
                  isComplete ? "bg-leaf/15 text-leaf hover:bg-leaf/25" : "bg-ink text-paper hover:bg-teal"
                }`}
              >
                {isComplete ? (
                  <>
                    <Icon name="check" size={18} strokeWidth={3} />
                    <span>{dictionary.evidence.complete}</span>
                  </>
                ) : (
                  <span>{isScreenshot ? dictionary.evidence.upload : dictionary.evidence.needed}</span>
                )}
              </Button>
            </Card>
          );
        })}
      </div>

      <Button variant="primary" size="lg" leftIcon={<Icon name="arrow" size={20} />} onClick={onContinue} className="mt-6">
        {dictionary.continue}
      </Button>
    </div>
  );
}
