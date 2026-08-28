import type { Dictionary } from "../lib/i18n";
import type { RoutingDecision } from "../lib/mockApi";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Field, Textarea } from "./ui/Field";
import { Pill } from "./ui/Pill";
import { Icon } from "./Icons";
import { StepHeading } from "./StepHeading";

type ComplaintDraftStepProps = {
  draft: string;
  routing: RoutingDecision;
  departments: readonly string[];
  selectedDepartment: string;
  dictionary: Dictionary;
  onDraftChange: (draft: string) => void;
  onDepartmentChange: (department: string) => void;
  onContinue: () => void;
};

export function ComplaintDraftStep({ draft, routing, departments, selectedDepartment, dictionary, onDraftChange, onDepartmentChange, onContinue }: ComplaintDraftStepProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <StepHeading eyebrow={dictionary.draft.eyebrow} title={dictionary.draft.title} intro={dictionary.draft.intro} />

      <Card className="overflow-hidden p-6 sm:p-8">
        <div className="flex items-center gap-3 border-b border-ink/10 pb-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tealSoft text-teal">
            <Icon name="document" size={22} />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-ink/45">{dictionary.draft.draftLabel}</p>
            <p className="text-xs font-semibold text-ink/50">{dictionary.draft.editHint}</p>
          </div>
        </div>
        <Field label={dictionary.draft.draftLabel} htmlFor="complaint-draft" className="mt-5">
          <Textarea
            id="complaint-draft"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            rows={12}
            className="resize-y text-[1.05rem] leading-8"
          />
        </Field>
      </Card>

      <Card className="mt-5 border-teal/20 bg-moss p-5 sm:p-6">
        <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-teal text-paper">
            <Icon name="spark" size={17} />
          </span>
          <div>
            <h2 className="text-sm font-extrabold">{dictionary.draft.routingLabel}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/70">{routing.reason}</p>
          </div>
        </div>
      </Card>

      <fieldset className="mt-7">
        <legend className="text-sm font-extrabold">{dictionary.draft.departmentLabel}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {departments.map((department) => {
            const active = department === selectedDepartment;
            return (
              <Button
                key={department}
                type="button"
                variant={active ? "soft" : "ghost"}
                size="md"
                fullWidth={false}
                aria-pressed={active}
                onClick={() => onDepartmentChange(department)}
                className="rounded-full px-4 py-3"
              >
                <Pill tone={active ? "active" : "default"} className={active ? "ring-4 ring-ink/15" : ""}>
                  {department}
                </Pill>
              </Button>
            );
          })}
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-ink/50">{dictionary.draft.departmentHint}</p>
      </fieldset>

      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        onClick={onContinue}
        className="mt-7"
        rightIcon={<Icon name="arrow" size={19} />}
      >
        {dictionary.saveAndContinue}
      </Button>
    </div>
  );
}
