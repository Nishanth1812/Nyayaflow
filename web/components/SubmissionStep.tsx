import type { Dictionary } from "../lib/i18n";
import type { OfficialStatus, SubmissionData } from "../lib/mockApi";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Icon } from "./Icons";
import { Pill } from "./ui/Pill";
import { StatusTranslator } from "./StatusTranslator";
import { StepHeading } from "./StepHeading";
import { Timeline } from "./Timeline";

type SubmissionStepProps = {
  submission: SubmissionData;
  status: OfficialStatus;
  statuses: readonly OfficialStatus[];
  dictionary: Dictionary;
  onStatusChange: (status: OfficialStatus) => void;
  onResolution: () => void;
};

export function SubmissionStep({ submission, status, statuses, dictionary, onStatusChange, onResolution }: SubmissionStepProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <StepHeading eyebrow={dictionary.submission.eyebrow} title={dictionary.submission.title} intro={dictionary.submission.intro} />

      <section className="rounded-2xl bg-teal p-5 text-paper sm:p-7">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-paper/15 text-paper">
            <Icon name="celebrate" size={26} />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-paper/70">{dictionary.submission.eyebrow}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.01em] sm:text-[1.85rem]">{dictionary.submission.title}</h2>
          </div>
        </div>
      </section>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-teal">{dictionary.submission.reference}</p>
            <p className="mt-2 text-3xl font-extrabold tracking-[0.01em] text-saffron sm:text-4xl">{submission.referenceNumber}</p>
          </div>
          <Pill tone="success" className="self-start sm:self-auto">{dictionary.submission.keepSafe}</Pill>
        </div>
        <p className="border-t border-ink/15 bg-cream/70 px-5 py-3 text-sm font-semibold text-ink/60 sm:px-7">
          {dictionary.submission.keepSafe} · {submission.submittedOn}
        </p>
      </Card>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">{dictionary.submission.timelineTitle}</h2>
          <Pill tone="warning">{status}</Pill>
        </div>
        <Card className="bg-cream p-4 sm:p-6">
          <Timeline events={submission.timeline} />
        </Card>
      </section>

      <div className="mt-6">
        <StatusTranslator status={status} statuses={statuses} dictionary={dictionary} onStatusChange={onStatusChange} />
      </div>

      <Button variant="primary" size="lg" leftIcon={<Icon name="arrow" size={20} />} onClick={onResolution} className="mt-6">
        {dictionary.submission.resolutionAction}
      </Button>
    </div>
  );
}
