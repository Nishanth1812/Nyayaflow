import type { Dictionary } from "../lib/i18n";
import type { OfficialStatus } from "../lib/mockApi";
import { translateStatus } from "../lib/mockApi";
import { Icon } from "./Icons";
import { Card } from "./ui/Card";
import { Field, Select } from "./ui/Field";

type StatusTranslatorProps = {
  status: OfficialStatus;
  statuses: readonly OfficialStatus[];
  dictionary: Dictionary;
  onStatusChange: (status: OfficialStatus) => void;
};

export function StatusTranslator({ status, statuses, dictionary, onStatusChange }: StatusTranslatorProps) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-paper" aria-hidden="true">
          <Icon name="spark" size={20} />
        </span>
        <div>
          <h2 className="text-base font-extrabold tracking-[-0.02em] text-ink">{dictionary.submission.statusTitle}</h2>
          <p className="mt-1 text-sm font-semibold text-ink/55">Government words, made clearer.</p>
        </div>
      </div>
      <Field label={dictionary.submission.officialLabel} htmlFor="official-status">
        <Select
          id="official-status"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as OfficialStatus)}
          className="mt-2 bg-cream text-sm font-extrabold"
        >
          {statuses.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
      </Field>
        <div className="mt-4 rounded-2xl border-l-4 border-saffron bg-saffronSoft px-4 py-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">{dictionary.submission.explanationLabel}</p>
        <p className="mt-1 text-sm font-bold leading-6 text-ink">{translateStatus(status)}</p>
      </div>
    </Card>
  );
}
