import type { Dictionary } from "../lib/i18n";
import { Icon } from "./Icons";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Field, Input, Select, Textarea } from "./ui/Field";
import { Pill } from "./ui/Pill";
import { StepHeading } from "./StepHeading";

export type IntakeValues = {
  complaint: string;
  beneficiaryId: string;
  state: string;
  lastPaymentDate: string;
};

type IntakeStepProps = {
  values: IntakeValues;
  dictionary: Dictionary;
  onChange: (field: keyof IntakeValues, value: string) => void;
  onVoiceInput: () => void;
  onContinue: () => void;
  showValidation?: boolean;
};

export function IntakeStep({ values, dictionary, onChange, onVoiceInput, onContinue, showValidation = false }: IntakeStepProps) {
  const t = dictionary.intake;
  const complaintInvalid = showValidation && !values.complaint.trim();
  const beneficiaryInvalid = showValidation && !values.beneficiaryId.trim();
  const stateInvalid = showValidation && !values.state;
  const paymentInvalid = showValidation && !values.lastPaymentDate;

  return (
    <div className="mx-auto max-w-2xl">
      <StepHeading eyebrow={t.eyebrow} title={t.title} intro={t.intro} />
      <div className="mb-5 flex items-start gap-3">
        <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal text-paper">
          <Icon name="spark" size={20} />
        </div>
        <div className="max-w-[36rem] rounded-2xl rounded-tl-sm bg-mist px-4 py-3 text-base font-semibold leading-7 text-ink/80">{t.assistant}</div>
      </div>

      <Card className="p-5 sm:p-6">
        <Field label={t.complaintLabel} htmlFor="complaint" error={complaintInvalid ? t.missingComplaint : undefined}>
          <Textarea
            id="complaint"
            value={values.complaint}
            onChange={(event) => onChange("complaint", event.target.value)}
            rows={3}
            placeholder={t.complaintPlaceholder}
            invalid={complaintInvalid}
            className="resize-none"
          />
        </Field>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Button variant="soft" size="md" onClick={onVoiceInput} leftIcon={<Icon name="mic" size={18} />}>
            {t.voice}
          </Button>
          <span className="text-xs font-semibold text-ink/45">{t.voiceHint}</span>
        </div>
      </Card>

      <div className="mb-4 mt-6 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">{t.detailsTitle}</h2>
          <p className="mt-1 text-sm text-ink/55">{t.detailsHint}</p>
        </div>
        <Pill tone="warning">{t.required}</Pill>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.beneficiaryId} htmlFor="beneficiary-id" error={beneficiaryInvalid ? t.missingBeneficiary : undefined}>
          <Input
            id="beneficiary-id"
            value={values.beneficiaryId}
            onChange={(event) => onChange("beneficiaryId", event.target.value)}
            placeholder={t.beneficiaryPlaceholder}
            invalid={beneficiaryInvalid}
          />
        </Field>
        <Field label={t.state} htmlFor="state" error={stateInvalid ? t.missingState : undefined}>
          <Select
            id="state"
            value={values.state}
            onChange={(event) => onChange("state", event.target.value)}
            invalid={stateInvalid}
          >
            <option value="">{t.statePlaceholder}</option>
            <option>Tamil Nadu</option>
            <option>Andhra Pradesh</option>
            <option>Karnataka</option>
            <option>Kerala</option>
          </Select>
        </Field>
        <Field label={t.lastPayment} htmlFor="last-payment" className="sm:col-span-2" error={paymentInvalid ? t.missingPayment : undefined}>
          <Input
            id="last-payment"
            type="date"
            value={values.lastPaymentDate}
            onChange={(event) => onChange("lastPaymentDate", event.target.value)}
            invalid={paymentInvalid}
          />
        </Field>
      </div>

      {showValidation ? (
        <p role="alert" className="mt-5 rounded-2xl bg-saffronSoft px-4 py-3 text-sm font-bold text-ink">
          {t.missingDetails}
        </p>
      ) : null}

      <Button variant="primary" size="lg" onClick={onContinue} rightIcon={<Icon name="arrow" size={19} />} className="mt-6">
        {dictionary.continue}
      </Button>
    </div>
  );
}
