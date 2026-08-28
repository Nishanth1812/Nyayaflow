import type { Dictionary } from "../lib/i18n";
import type { DiagnosticCheck } from "../lib/mockApi";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Icon } from "./Icons";
import { StepHeading } from "./StepHeading";

type DiagnosticStepProps = {
  check: DiagnosticCheck;
  answer: boolean | undefined;
  dictionary: Dictionary;
  categoryLabel?: string;
  onAnswer: (answer: boolean) => void;
  onContinue: () => void;
};

export function DiagnosticStep({ check, answer, dictionary, categoryLabel = "PM-KISAN payment check", onAnswer, onContinue }: DiagnosticStepProps) {
  const toneIcon = check.blockingAnswer === "yes" ? "warning" : "shield";
  const yesSelected = answer === true;
  const noSelected = answer === false;
  const continueLabel = dictionary.continue;

  return (
    <div className="mx-auto max-w-2xl">
      <StepHeading eyebrow={dictionary.diagnostic.eyebrow} title={dictionary.diagnostic.title} intro={dictionary.diagnostic.intro} />
      <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-ink/45">
        <span className="h-2 w-2 rounded-full bg-saffron" /> {categoryLabel}
      </div>

      <Card className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-saffronSoft text-saffron">
            <Icon name={toneIcon} size={28} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-snug tracking-[-0.01em] text-ink">{check.question}</h2>
            <p className="mt-3 text-base leading-7 text-ink/60">{check.helper}</p>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant={yesSelected ? "primary" : "soft"}
            size="lg"
            fullWidth
            aria-pressed={yesSelected}
            onClick={() => onAnswer(true)}
            className={yesSelected ? "ring-4 ring-teal/20" : ""}
            leftIcon={<Icon name="check" size={22} strokeWidth={2.5} />}
          >
            <span className="flex flex-col items-start leading-tight">
              <span>{dictionary.diagnostic.yes}</span>
              <span className="text-xs font-semibold opacity-70">{dictionary.diagnostic.yesHint}</span>
            </span>
          </Button>
          <Button
            type="button"
            variant={noSelected ? "accent" : "soft"}
            size="lg"
            fullWidth
            aria-pressed={noSelected}
            onClick={() => onAnswer(false)}
            className={noSelected ? "ring-4 ring-coral/25" : ""}
            leftIcon={<Icon name="warning" size={22} strokeWidth={2.5} />}
          >
            <span className="flex flex-col items-start leading-tight">
              <span>{dictionary.diagnostic.no}</span>
              <span className="text-xs font-semibold opacity-70">{dictionary.diagnostic.noHint}</span>
            </span>
          </Button>
        </div>
      </Card>

      {answer === (check.blockingAnswer === "yes") ? (
        <Card className="mt-5 border-saffron/30 bg-saffronSoft p-5 sm:p-6" aria-live="assertive">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.13em] text-ink">
            <Icon name="warning" size={16} /> {dictionary.diagnostic.fixLabel}
          </div>
            <h3 className="mt-3 text-lg font-bold tracking-[-0.01em] text-ink">{check.fixTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-ink/65">{check.fixIntro}</p>
            <h4 className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-ink/50">{dictionary.diagnostic.checklist}</h4>
          <ul className="mt-3 space-y-3">
            {check.fixItems.map((item) => (
              <li key={item} className="flex gap-3 text-sm font-semibold leading-5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper text-saffron">
                  <Icon name="check" size={13} />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-saffron/20 pt-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-ink">{dictionary.diagnostic.why}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink/70">{check.recommendedAction}</p>
          </div>
        </Card>
      ) : null}

      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        disabled={answer === undefined}
        onClick={onContinue}
        className="mt-6"
        rightIcon={<Icon name="arrow" size={19} />}
      >
        {continueLabel}
      </Button>
    </div>
  );
}
