"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/Icons";
import { CategoryPicker } from "../components/CategoryPicker";
import { ComplaintDraftStep } from "../components/ComplaintDraftStep";
import { DiagnosticStep } from "../components/DiagnosticStep";
import { EvidenceStep } from "../components/EvidenceStep";
import { IntakeStep, type IntakeValues } from "../components/IntakeStep";
import { ResolutionStep } from "../components/ResolutionStep";
import { SubmissionStep } from "../components/SubmissionStep";
import * as api from "../lib/api";
import { categoryPickerDictionaries } from "../lib/categoryI18n";
import { dictionaries, type Locale, type ResolutionKey } from "../lib/i18n";
import {
  CATEGORY_OPTIONS,
  FALLBACK_DEPARTMENT,
  createComplaintDraft,
  createSubmission,
  diagnose,
  getDemoIntake,
  getDepartmentOptions,
  getDiagnosticRules,
  getRoutingDecision,
  scoreEvidence,
  type Category,
  type DiagnosticAnswers,
  type DiagnosticResult,
  type DiagnosticRulesResponse,
  type EvidenceState,
  type OfficialStatus,
  type RoutingDecision,
  type SubmissionData,
} from "../lib/mockApi";

type FlowStep = "category" | "intake" | "diagnostic" | "draft" | "evidence" | "submission" | "resolution";
type EvidenceKey = keyof EvidenceState;

const statuses: OfficialStatus[] = ["Under process", "Disposed", "Sent to department", "Awaiting clarification"];
const initialEvidence: EvidenceState = { beneficiaryId: true, paymentDates: true, paymentScreenshot: false, bankReference: false };

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [step, setStep] = useState<FlowStep>("category");
  const [category, setCategory] = useState<Category | undefined>();
  const [intake, setIntake] = useState<IntakeValues>({ complaint: "", beneficiaryId: "", state: "", lastPaymentDate: "" });
  const [showValidation, setShowValidation] = useState(false);
  const [diagnosticIndex, setDiagnosticIndex] = useState(0);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<DiagnosticAnswers>({});
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [evidence, setEvidence] = useState<EvidenceState>(initialEvidence);
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [officialStatus, setOfficialStatus] = useState<OfficialStatus>("Disposed");
  const [resolutionOutcome, setResolutionOutcome] = useState<ResolutionKey | undefined>();

  const [rules, setRules] = useState<DiagnosticRulesResponse | null>(null);
  const [routing, setRouting] = useState<RoutingDecision | null>(null);
  const [caseId, setCaseId] = useState<number | null>(null);
  const [serverAppeal, setServerAppeal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categoryForApi = category ?? "pm_kisan_payment_failure";
  const pickerCopy = categoryPickerDictionaries[locale];
  const dictionary = useMemo(() => ({
    ...dictionaries[locale],
    stages: [pickerCopy.stage, ...dictionaries[locale].stages],
    categoryPicker: pickerCopy,
  }), [locale, pickerCopy]);

  useEffect(() => {
    let cancelled = false;
    const loadRules = async () => {
      try {
        const [loadedRules, loadedRouting] = await Promise.all([
          api.fetchDiagnosticRules(categoryForApi),
          api.routeIssue(categoryForApi, intake.complaint),
        ]);
        if (cancelled) return;
        setRules(loadedRules);
        setRouting(loadedRouting);
        setSelectedDepartment((previous) => previous || loadedRules.routing.department);
      } catch {
        if (cancelled) return;
        setRules(getDiagnosticRules(categoryForApi));
        setRouting(getRoutingDecision({ category: categoryForApi, issueDescription: intake.complaint }));
        setSelectedDepartment((previous) => previous || getDepartmentOptions(categoryForApi)[0]);
      }
    };
    loadRules();
    return () => {
      cancelled = true;
    };
  }, [categoryForApi, intake.complaint]);

  useEffect(() => {
    if (!caseId) return;
    if (resolutionOutcome !== "no" && resolutionOutcome !== "wrong_dept") return;
    let cancelled = false;
    api.confirmResolution(caseId, resolutionOutcome)
      .then((result) => {
        if (!cancelled) setServerAppeal(result.appealDraft);
      })
      .catch(() => {
        if (!cancelled) setServerAppeal(null);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId, resolutionOutcome]);

  const departments = rules ? [rules.routing.department, FALLBACK_DEPARTMENT] : [];
  const demo = useMemo(() => getDemoIntake(categoryForApi), [categoryForApi]);
  const currentCheck = rules ? (rules.questions[diagnosticIndex] ?? rules.questions[0]) : null;
  const selectedCategoryTitle = category ? pickerCopy.cards.find((card) => card.category === category)?.title ?? CATEGORY_OPTIONS.find((option) => option.category === category)?.title : undefined;
  const currentStage = step === "category" ? 0 : step === "intake" ? 1 : step === "diagnostic" ? 2 : step === "draft" ? 3 : step === "evidence" ? 4 : step === "submission" ? 6 : 7;

  function handleCategorySelect(nextCategory: Category) {
    const nextDemo = getDemoIntake(nextCategory);
    setCategory(nextCategory);
    setStep("intake");
    setIntake({ complaint: "", beneficiaryId: nextDemo.beneficiaryId, state: nextDemo.state, lastPaymentDate: nextDemo.lastPaymentDate });
    setShowValidation(false);
    setDiagnosticIndex(0);
    setDiagnosticAnswers({});
    setSelectedDepartment("");
    setDraft("");
    setEvidence(initialEvidence);
    setSubmission(null);
    setCaseId(null);
    setServerAppeal(null);
    setOfficialStatus("Disposed");
    setResolutionOutcome(undefined);
  }

  function handleIntakeChange(field: keyof IntakeValues, value: string) {
    setIntake((current) => ({ ...current, [field]: value }));
    setShowValidation(false);
  }

  function handleIntakeContinue() {
    if (!intake.complaint.trim() || !intake.beneficiaryId.trim() || !intake.state || !intake.lastPaymentDate) {
      setShowValidation(true);
      return;
    }
    setStep("diagnostic");
  }

  function handleDiagnosticAnswer(answer: boolean) {
    if (!currentCheck) return;
    setDiagnosticAnswers((current) => ({ ...current, [currentCheck.key]: answer }));
  }

  async function handleDiagnosticContinue() {
    if (!currentCheck || !rules) return;
    const blockingAnswer = currentCheck.blockingAnswer ?? "no";
    const goodAnswer = blockingAnswer === "no";
    if (diagnosticAnswers[currentCheck.key] !== goodAnswer) return;
    if (diagnosticIndex < rules.questions.length - 1) {
      setDiagnosticIndex((current) => current + 1);
      return;
    }
    const runDiagnose = async (): Promise<DiagnosticResult> => {
      try {
        return await api.diagnoseCategory(categoryForApi, diagnosticAnswers);
      } catch {
        return diagnose(categoryForApi, diagnosticAnswers);
      }
    };
    const result = await runDiagnose();
    if (result.outcome === "ready_to_file") {
      const department = result.recommendedDepartment ?? routing?.department ?? "";
      setSelectedDepartment(department);
      setDraft(createComplaintDraft({ ...intake, department, category: categoryForApi }));
      setStep("draft");
    } else if (result.failedCheck) {
      const failedIndex = rules.questions.findIndex((question) => question.key === result.failedCheck);
      if (failedIndex >= 0) setDiagnosticIndex(failedIndex);
    }
  }

  function handleEvidenceToggle(key: EvidenceKey) {
    setEvidence((current) => ({ ...current, [key]: !current[key] }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const created = await api.createCase({
        category: categoryForApi,
        complaintText: intake.complaint,
        diagnosticAnswers,
        routedDepartment: selectedDepartment,
        routingReason: routing?.reason ?? "",
        evidence: api.buildEvidenceItems(categoryForApi, evidence),
      });
      setCaseId(created.id);
      const nextSubmission = api.adaptCaseToSubmission(created);
      setSubmission(nextSubmission);
      setOfficialStatus(nextSubmission.status);
    } catch {
      const nextSubmission = createSubmission({ department: selectedDepartment, complaint: intake.complaint });
      setSubmission(nextSubmission);
      setOfficialStatus(nextSubmission.status);
    } finally {
      setSubmitting(false);
      setStep("submission");
    }
  }

  function handleBack() {
    if (step === "intake") {
      setStep("category");
      return;
    }
    if (step === "diagnostic") {
      setStep("intake");
      return;
    }
    if (step === "draft") {
      setStep("diagnostic");
      setDiagnosticIndex(rules ? rules.questions.length - 1 : 0);
      return;
    }
    if (step === "evidence") {
      setStep("draft");
      return;
    }
    if (step === "submission") {
      setStep("evidence");
      return;
    }
    if (step === "resolution") setStep("submission");
  }

  const isLoadingRules = step === "diagnostic" && !rules;

  return (
    <AppShell locale={locale} dictionary={dictionary} currentStage={currentStage} onLocaleChange={setLocale} onBack={handleBack}>
      {step === "category" ? <CategoryPicker dictionary={dictionary} options={CATEGORY_OPTIONS} onSelect={handleCategorySelect} /> : null}
      {step === "intake" ? <IntakeStep values={intake} dictionary={dictionary} onChange={handleIntakeChange} onVoiceInput={() => handleIntakeChange("complaint", demo.sampleVoiceText)} onContinue={handleIntakeContinue} showValidation={showValidation} /> : null}
      {step === "diagnostic" && currentCheck ? <DiagnosticStep check={currentCheck} answer={diagnosticAnswers[currentCheck.key]} categoryLabel={selectedCategoryTitle} dictionary={dictionary} onAnswer={handleDiagnosticAnswer} onContinue={handleDiagnosticContinue} /> : null}
      {step === "diagnostic" && isLoadingRules ? (
        <Card className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tealSoft text-teal">
            <Icon name="spark" size={28} className="animate-spin" />
          </span>
          <p className="text-sm font-semibold text-ink/55">Loading checks…</p>
        </Card>
      ) : null}
      {step === "draft" ? <ComplaintDraftStep draft={draft} routing={routing ?? getRoutingDecision({ category: categoryForApi, issueDescription: intake.complaint })} departments={departments} selectedDepartment={selectedDepartment} dictionary={dictionary} onDraftChange={setDraft} onDepartmentChange={setSelectedDepartment} onContinue={() => setStep("evidence")} /> : null}
      {step === "evidence" ? <EvidenceStep evidence={evidence} score={scoreEvidence(evidence)} dictionary={dictionary} onToggle={handleEvidenceToggle} onMockUpload={() => setEvidence((current) => ({ ...current, paymentScreenshot: true }))} onContinue={handleSubmit} /> : null}
      {step === "submission" && submission ? <SubmissionStep submission={submission} status={officialStatus} statuses={statuses} dictionary={dictionary} onStatusChange={setOfficialStatus} onResolution={() => setStep("resolution")} /> : null}
      {step === "resolution" && submission ? <ResolutionStep complaint={intake.complaint} department={selectedDepartment} status={officialStatus} referenceNumber={submission.referenceNumber} dictionary={dictionary} outcome={resolutionOutcome} onOutcome={(next) => { setServerAppeal(null); setResolutionOutcome(next); }} serverAppeal={serverAppeal} /> : null}
    </AppShell>
  );
}
