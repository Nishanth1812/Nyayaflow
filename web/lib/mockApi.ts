export type Category = "pm_kisan_payment_failure" | "epfo_claim_rejected" | "income_tax_refund_delayed" | "scholarship_nsp_payment_stuck" | "nrega_wage_delayed";
export type DiagnosticKey = string;
export type DiagnosticAnswers = Record<DiagnosticKey, boolean | undefined>;

export type DiagnosticCheck = {
  key: DiagnosticKey;
  question: string;
  helper: string;
  fixTitle: string;
  fixIntro: string;
  fixItems: string[];
  recommendedAction: string;
  blockingAnswer?: "yes" | "no";
};

export type DiagnosticResult = {
  outcome: "needs_action" | "ready_to_file";
  failedCheck?: DiagnosticKey;
  reason: string;
  recommendedDepartment?: string;
  fixChecklist?: DiagnosticCheck;
};

export type IntakeData = { complaint: string; sampleVoiceText: string; beneficiaryId: string; state: string; lastPaymentDate: string };
export type RoutingInput = { category: Category | "general"; issueDescription: string };
export type RoutingDecision = { department: string; reason: string; matchedRule: string };
export type DiagnosticRulesResponse = { category: Category; questions: DiagnosticCheck[]; routing: { department: string; reason: string; matchedRule: string } };
export type CategoryOption = { category: Category; title: string; description: string };
export type DraftInput = { complaint: string; beneficiaryId: string; state: string; lastPaymentDate: string; department: string; category?: Category };
export type EvidenceState = { beneficiaryId: boolean; paymentDates: boolean; paymentScreenshot: boolean; bankReference: boolean };
export type EvidenceScore = { completed: number; total: number; percentage: number };
export type OfficialStatus = "Under process" | "Disposed" | "Sent to department" | "Awaiting clarification";
export type TimelineKey = "submitted" | "routed" | "window" | "reminder" | "appeal" | "resolved";
export type TimelineEvent = { key: TimelineKey; label: string; detail: string; state: "complete" | "current" | "upcoming" };
export type SubmissionInput = { department: string; complaint: string };
export type SubmissionData = { referenceNumber: string; status: OfficialStatus; currentStage: TimelineKey; submittedOn: string; timeline: TimelineEvent[] };
export type AppealInput = { originalComplaint: string; department: string; status: OfficialStatus; missingRemedy: string; referenceNumber: string };

export const DEPARTMENTS = [
  "Ministry of Agriculture and Farmers Welfare — PM-KISAN Cell",
  "General grievance desk — needs manual categorisation",
] as const;

const CATEGORY_DEPARTMENTS = {
  pm_kisan_payment_failure: "Ministry of Agriculture and Farmers Welfare — PM-KISAN Cell",
  epfo_claim_rejected: "EPFO — Employees’ Provident Fund Organisation — Claims Cell",
  income_tax_refund_delayed: "Income Tax Department — Centralised Processing Centre",
  scholarship_nsp_payment_stuck: "Ministry of Education — National Scholarship Portal",
  nrega_wage_delayed: "Ministry of Rural Development — MGNREGA Cell",
} satisfies Record<Category, string>;

export const FALLBACK_DEPARTMENT = DEPARTMENTS[1];

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { category: "pm_kisan_payment_failure", title: "PM-KISAN payment stopped", description: "An instalment was approved before, but has not reached you." },
  { category: "epfo_claim_rejected", title: "EPFO PF claim rejected", description: "Your provident-fund withdrawal or transfer claim was rejected." },
  { category: "income_tax_refund_delayed", title: "Income tax refund delayed", description: "Your filed return is complete, but the refund has not arrived." },
  { category: "scholarship_nsp_payment_stuck", title: "Scholarship payment stuck", description: "Your scholarship application is approved, but payment is still pending." },
  { category: "nrega_wage_delayed", title: "MGNREGA wage not paid", description: "You completed work under MGNREGA, but the wage has not reached you." },
];

export const DIAGNOSTIC_CHECKS: DiagnosticCheck[] = [
  { key: "eKycComplete", question: "Is your e-KYC complete?", helper: "e-KYC confirms that the beneficiary record belongs to you.", fixTitle: "Complete e-KYC first", fixIntro: "Payments usually pause when this identity check is incomplete.", fixItems: ["Open the PM-KISAN portal or visit your nearest CSC", "Choose e-KYC and verify with Aadhaar OTP", "Save the confirmation message"], recommendedAction: "After e-KYC shows “completed”, come back and file this complaint." },
  { key: "bankAadhaarSeeded", question: "Is your bank account Aadhaar-seeded?", helper: "The account must be linked to the Aadhaar used for PM-KISAN.", fixTitle: "Link Aadhaar to your bank account", fixIntro: "Your bank can confirm or update this link without changing your account.", fixItems: ["Visit your bank branch with your passbook and Aadhaar", "Ask for Aadhaar seeding for the account receiving PM-KISAN", "Keep the acknowledgement slip"], recommendedAction: "Ask the bank to re-check the link after 2–3 working days." },
  { key: "npciMappingActive", question: "Is NPCI mapping active?", helper: "NPCI mapping tells the payment system where to send your money.", fixTitle: "Refresh your NPCI mapping", fixIntro: "An inactive mapping can stop an otherwise approved instalment.", fixItems: ["Ask your bank to check your Aadhaar mapper status", "If needed, submit a consent form for NPCI mapping", "Request a printed acknowledgement"], recommendedAction: "Return here once the bank confirms that mapping is active." },
  { key: "landRecordNameMatch", question: "Does your name match the land record?", helper: "The name on the PM-KISAN record should match the state land record.", fixTitle: "Correct the land-record name mismatch", fixIntro: "Even a small spelling difference can hold a payment for review.", fixItems: ["Compare your PM-KISAN and patta/chitta land-record names", "Visit the VAO or Taluk office if a correction is needed", "Carry the correction acknowledgement"], recommendedAction: "Ask the PM-KISAN nodal officer to re-verify after the correction." },
];

const CATEGORY_RULES: Record<Category, DiagnosticRulesResponse> = {
  pm_kisan_payment_failure: {
    category: "pm_kisan_payment_failure",
    questions: DIAGNOSTIC_CHECKS,
    routing: { department: CATEGORY_DEPARTMENTS.pm_kisan_payment_failure, reason: "We selected this department because your issue mentions PM-KISAN instalments and land-record verification.", matchedRule: "pm_kisan" },
  },
  epfo_claim_rejected: {
    category: "epfo_claim_rejected",
    questions: [
      { key: "uanLinked", question: "Is your UAN linked to the correct Aadhaar?", helper: "Your UAN identity details must match the Aadhaar record used for the claim.", fixTitle: "Correct the UAN-Aadhaar link", fixIntro: "A mismatch can cause an otherwise valid PF claim to be rejected.", fixItems: ["Check your UAN profile for the Aadhaar status", "Ask your employer or EPFO to correct a mismatch", "Save the acknowledgement or correction request"], recommendedAction: "Try the claim again after EPFO confirms the correction." },
      { key: "bankKycVerified", question: "Is your bank account and KYC verified?", helper: "EPFO needs a verified bank account to release a PF withdrawal.", fixTitle: "Complete your bank KYC", fixIntro: "Unverified bank details can block claim payment.", fixItems: ["Check the bank account shown in your UAN profile", "Ask your employer to approve pending KYC", "Keep your passbook or cancelled cheque ready"], recommendedAction: "Submit the claim again once KYC shows approved." },
      { key: "exitDateUpdated", question: "Is your date of exit updated?", helper: "The date of exit tells EPFO whether the claim is eligible to be processed.", fixTitle: "Update your date of exit", fixIntro: "A missing or incorrect exit date often stops final PF claims.", fixItems: ["Check the service history in your UAN account", "Ask your previous employer to update the exit date", "Raise an EPFO correction request if the employer is unavailable"], recommendedAction: "Wait for the service history to refresh before filing again." },
      { key: "claimDetailsMatch", question: "Do the claim details match your PF record?", helper: "Your name, account number and claim type should match the EPFO record.", fixTitle: "Fix the claim-detail mismatch", fixIntro: "Small differences can send a claim back for correction.", fixItems: ["Compare the claim with your UAN profile", "Correct your name or account details through KYC", "Keep the rejection reason for your next request"], recommendedAction: "Re-submit with the corrected claim details." },
    ],
    routing: { department: CATEGORY_DEPARTMENTS.epfo_claim_rejected, reason: "We selected this department because your issue mentions PF withdrawal and UAN mismatch.", matchedRule: "epfo_claim" },
  },
  income_tax_refund_delayed: {
    category: "income_tax_refund_delayed",
    questions: [
      { key: "panLinked", question: "Is your PAN linked to your Aadhaar?", helper: "A linked PAN helps the department process your filed return and refund.", fixTitle: "Link PAN and Aadhaar", fixIntro: "An inoperative or unlinked PAN can delay refund processing.", fixItems: ["Check the link status on the income-tax e-filing portal", "Complete the linking steps if it is pending", "Save the confirmation screen"], recommendedAction: "Check your refund status again after the portal updates." },
      { key: "returnVerified", question: "Has your income-tax return been verified?", helper: "The department starts processing a refund only after verification.", fixTitle: "Verify your income-tax return", fixIntro: "An unverified return remains incomplete even after filing.", fixItems: ["Open e-File → Income Tax Returns → e-Verify Return", "Use Aadhaar OTP or your bank account option", "Keep the acknowledgement number"], recommendedAction: "Allow processing time after successful verification." },
      { key: "bankValidated", question: "Is the refund bank account validated?", helper: "Refunds can only go to a validated bank account in your profile.", fixTitle: "Validate your bank account", fixIntro: "A bank validation failure can send the refund back.", fixItems: ["Open your profile on the e-filing portal", "Validate the account and nominate it for refund", "Check the account number and IFSC"], recommendedAction: "Re-check the refund status after validation succeeds." },
      { key: "noticeCleared", question: "Have you answered any pending notice?", helper: "A pending notice or adjustment can pause a refund.", fixTitle: "Respond to the pending notice", fixIntro: "The department may wait for your clarification before releasing money.", fixItems: ["Check Pending Actions on the e-filing portal", "Read the notice and upload the requested response", "Download the submission acknowledgement"], recommendedAction: "Keep the response number for any refund follow-up." },
    ],
    routing: { department: CATEGORY_DEPARTMENTS.income_tax_refund_delayed, reason: "We selected this department because your issue mentions an income-tax refund delay and return processing.", matchedRule: "income_tax_refund" },
  },
  scholarship_nsp_payment_stuck: {
    category: "scholarship_nsp_payment_stuck",
    questions: [
      { key: "applicationSubmitted", question: "Was your scholarship application submitted successfully?", helper: "A submitted application gets an application number for tracking.", fixTitle: "Complete the scholarship application", fixIntro: "A saved draft cannot move to verification or payment.", fixItems: ["Open your application on the National Scholarship Portal", "Submit any remaining section and note the application number", "Download the submitted application"], recommendedAction: "Track the application after it shows submitted." },
      { key: "instituteVerified", question: "Has your institute verified the application?", helper: "Your school or college must verify the application before the department can approve it.", fixTitle: "Ask your institute to verify it", fixIntro: "Institute verification is a required step before payment.", fixItems: ["Show your application number to the scholarship nodal officer", "Ask which document needs correction", "Keep the verification acknowledgement"], recommendedAction: "Check the portal again after institute verification." },
      { key: "bankAadhaarSeeded", question: "Is your bank account Aadhaar-seeded?", helper: "The scholarship payment needs an active account linked to the student record.", fixTitle: "Update your bank details", fixIntro: "A missing bank link can hold an approved scholarship payment.", fixItems: ["Check the account and IFSC in your application", "Ask your bank to confirm Aadhaar seeding", "Report any account change through the portal"], recommendedAction: "Ask the nodal officer to re-validate the account." },
      { key: "applicationDetailsMatch", question: "Do your application details match your documents?", helper: "Name, course and identity details are checked before payment.", fixTitle: "Correct the application mismatch", fixIntro: "A mismatch can keep payment pending after approval.", fixItems: ["Compare the application with your Aadhaar and institute record", "Ask the nodal officer to unlock a correction", "Upload a clear supporting document"], recommendedAction: "Track the application after the correction is approved." },
    ],
    routing: { department: CATEGORY_DEPARTMENTS.scholarship_nsp_payment_stuck, reason: "We selected this department because your issue mentions a scholarship application and payment verification.", matchedRule: "scholarship_payment" },
  },
  nrega_wage_delayed: {
    category: "nrega_wage_delayed",
    questions: [
      { key: "jobCardAadhaarSeeded", question: "Is your MGNREGA job card Aadhaar-seeded?", helper: "The job card must be linked to Aadhaar to receive wages directly.", fixTitle: "Seed your job card with Aadhaar", fixIntro: "Wages are paid to the Aadhaar-linked account, so the link must be correct.", fixItems: ["Visit your Gram Panchayat or local CSC and complete Aadhaar seeding for the job card", "Confirm the job-card number appears against the correct Aadhaar in the NREGA portal"], recommendedAction: "Confirm the job-card link after 2–3 working days." },
      { key: "bankAccountAadhaarSeeded", question: "Is the wage bank account Aadhaar-seeded?", helper: "Wages are credited to the bank account linked to the job-card Aadhaar.", fixTitle: "Link Aadhaar to the wage account", fixIntro: "An unseeded account can hold an approved wage payment.", fixItems: ["Ask your bank to seed the account with the same Aadhaar used for the job card", "Keep the bank acknowledgement for the wage account"], recommendedAction: "Ask the bank to re-check the link after 2–3 working days." },
      { key: "workInMusterRoll", question: "Is your work recorded in the muster roll?", helper: "Muster rolls record the days worked; wages are calculated from them.", fixTitle: "Get your work recorded in the muster roll", fixIntro: "Wages cannot be processed without muster-roll entries.", fixItems: ["Ask the mate or ward member to record your attendance in the muster roll", "Check that the work-site attendance matches the days you actually worked"], recommendedAction: "Verify the muster entry before raising a wage complaint." },
      { key: "workMeasuredVerified", question: "Has the completed work been measured and verified?", helper: "Measurement and social audit verify the work so wages can be released.", fixTitle: "Get the work measured and verified", fixIntro: "Unmeasured work stays pending in the wage pipeline.", fixItems: ["Request measurement of the completed work by the Panchayat or technical officer", "Attend the social audit if your work is listed for verification"], recommendedAction: "Follow up after the measurement and verification is done." },
    ],
    routing: { department: CATEGORY_DEPARTMENTS.nrega_wage_delayed, reason: "We selected this department because your issue mentions MGNREGA work and wage payment.", matchedRule: "nrega_wage" },
  },
};

const STATUS_EXPLANATIONS: Record<OfficialStatus, string> = {
  "Under process": "The department has not completed a final action yet.",
  Disposed: "The department has closed the complaint; this does not necessarily mean payment or service was received.",
  "Sent to department": "Your complaint has been routed, but action may not have started.",
  "Awaiting clarification": "The department may need more information from you.",
};

export function getDemoIntake(category: Category = "pm_kisan_payment_failure"): IntakeData {
  const samples: Record<Category, IntakeData> = {
    pm_kisan_payment_failure: { complaint: "My PM-KISAN instalment stopped after two payments.", sampleVoiceText: "My PM-KISAN instalment stopped after two payments.", beneficiaryId: "PMK-TN-4827", state: "Tamil Nadu", lastPaymentDate: "2025-12-15" },
    epfo_claim_rejected: { complaint: "My PF withdrawal claim was rejected even though my UAN details are correct.", sampleVoiceText: "My PF withdrawal claim was rejected even though my UAN details are correct.", beneficiaryId: "EPFO-DEMO-4827", state: "Tamil Nadu", lastPaymentDate: "2026-01-08" },
    income_tax_refund_delayed: { complaint: "My income tax refund is delayed after I filed and verified my return.", sampleVoiceText: "My income tax refund is delayed after I filed and verified my return.", beneficiaryId: "ITR-DEMO-4827", state: "Tamil Nadu", lastPaymentDate: "2026-02-11" },
    scholarship_nsp_payment_stuck: { complaint: "My scholarship application was approved, but the payment is still stuck.", sampleVoiceText: "My scholarship application was approved, but the payment is still stuck.", beneficiaryId: "NSP-DEMO-4827", state: "Tamil Nadu", lastPaymentDate: "2026-01-24" },
    nrega_wage_delayed: { complaint: "I completed MGNREGA work last month, but my wage has not been credited.", sampleVoiceText: "I completed MGNREGA work last month, but my wage has not been credited.", beneficiaryId: "NREGA-TN-5582", state: "Tamil Nadu", lastPaymentDate: "2026-02-20" },
  };
  return samples[category];
}

// Mirrors GET /diagnostic-rules/{category}; replace this function with a real client later.
export function getDiagnosticRules(category: Category): DiagnosticRulesResponse {
  const rules = CATEGORY_RULES[category];
  return { ...rules, questions: rules.questions.map((question) => ({ ...question, fixItems: [...question.fixItems] })) };
}

export function getDepartmentOptions(category: Category): string[] {
  const rules = getDiagnosticRules(category);
  return [rules.routing.department, FALLBACK_DEPARTMENT];
}

export function getDiagnosticCheck(key: DiagnosticKey): DiagnosticCheck {
  return DIAGNOSTIC_CHECKS.find((check) => check.key === key) ?? DIAGNOSTIC_CHECKS[0];
}

export function diagnose(answers: DiagnosticAnswers): DiagnosticResult;
export function diagnose(category: Category, answers: DiagnosticAnswers): DiagnosticResult;
export function diagnose(categoryOrAnswers: Category | DiagnosticAnswers, maybeAnswers?: DiagnosticAnswers): DiagnosticResult {
  const category = typeof categoryOrAnswers === "string" ? categoryOrAnswers : "pm_kisan_payment_failure";
  const answers = maybeAnswers ?? (categoryOrAnswers as DiagnosticAnswers);
  const rules = getDiagnosticRules(category);
  const failedCheck = rules.questions.find((check) => answers[check.key] !== true);
  if (!failedCheck) return { outcome: "ready_to_file", reason: "All " + rules.questions.length + " prerequisite checks are marked complete. Your complaint is ready to route.", recommendedDepartment: rules.routing.department };
  return { outcome: "needs_action", failedCheck: failedCheck.key, reason: failedCheck.fixTitle + ".", fixChecklist: failedCheck };
}

export function getRoutingDecision({ category, issueDescription }: RoutingInput): RoutingDecision {
  void issueDescription;
  if (category === "general") return { department: FALLBACK_DEPARTMENT, reason: "We could not match a specific service rule, so a general grievance desk will review it.", matchedRule: "fallback" };
  return getDiagnosticRules(category).routing;
}

export function createComplaintDraft({ complaint, beneficiaryId, state, lastPaymentDate, department, category = "pm_kisan_payment_failure" }: DraftInput): string {
  if (category === "pm_kisan_payment_failure") return "Subject: PM-KISAN instalment not received\n\nI am a PM-KISAN beneficiary from " + state + ". " + complaint + "\n\nBeneficiary ID: " + beneficiaryId + "\nLast payment received: " + lastPaymentDate + "\n\nI request that the department verify my e-KYC, Aadhaar-seeded bank account, NPCI mapping, and land-record name match, then release the pending instalment if I am eligible.\n\nDepartment: " + department;
  const categoryCopy: Record<Exclude<Category, "pm_kisan_payment_failure">, { subject: string; request: string }> = {
    epfo_claim_rejected: { subject: "EPFO PF claim rejected", request: "I request that EPFO verify my UAN, KYC, service history and claim details, then process the eligible PF claim or provide the exact rejection reason." },
    income_tax_refund_delayed: { subject: "Income-tax refund delayed", request: "I request that the Income Tax Department verify my return, bank validation and any pending notice, then release the eligible refund or provide the exact reason for delay." },
    scholarship_nsp_payment_stuck: { subject: "Scholarship payment not received", request: "I request that the scholarship department verify my application, institute verification and bank details, then release the eligible payment or provide the exact reason for delay." },
    nrega_wage_delayed: { subject: "MGNREGA wage not paid", request: "I request that the MGNREGA cell verify my job-card Aadhaar seeding, wage account, muster-roll entry and work measurement, then release the pending wage or provide the exact reason for delay." },
  };
  const copy = categoryCopy[category];
  return "Subject: " + copy.subject + "\n\nI am a citizen from " + state + ". " + complaint + "\n\nApplication or beneficiary ID: " + beneficiaryId + "\nLast update received: " + lastPaymentDate + "\n\n" + copy.request + "\n\nDepartment: " + department;
}

export function scoreEvidence(evidence: EvidenceState): EvidenceScore {
  const completed = Object.values(evidence).filter(Boolean).length;
  const total = Object.keys(evidence).length;
  return { completed, total, percentage: Math.round((completed / total) * 100) };
}

export function createSubmission({ department, complaint }: SubmissionInput): SubmissionData {
  return {
    referenceNumber: "NYA-2026-0427",
    status: "Disposed",
    currentStage: "reminder",
    submittedOn: "26 Aug 2026",
    timeline: [
      { key: "submitted", label: "Submitted", detail: "26 Aug · Sent to " + department.split(" — ")[0], state: "complete" },
      { key: "routed", label: "Routed to department", detail: "The receiving team has received your grievance", state: "complete" },
      { key: "window", label: "21-day window", detail: "The department has time to review and respond", state: "complete" },
      { key: "reminder", label: "Reminder", detail: "Official status: Disposed · " + complaint.slice(0, 44) + "…", state: "current" },
      { key: "appeal", label: "Appeal / escalation", detail: "Available if the remedy did not reach you", state: "upcoming" },
      { key: "resolved", label: "You confirm resolution", detail: "Your answer closes the loop", state: "upcoming" },
    ],
  };
}

export function translateStatus(status: OfficialStatus): string {
  return STATUS_EXPLANATIONS[status];
}

export function createAppeal({ originalComplaint, department, status, missingRemedy, referenceNumber }: AppealInput): string {
  return "Subject: Appeal — remedy still missing for grievance " + referenceNumber + "\n\nTo " + department + ",\n\nI am appealing the closure of my original complaint:\n“" + originalComplaint + "”\n\nThe official status is “" + status + "”, but the requested remedy has not reached me. " + missingRemedy + "\n\nPlease reopen this grievance, verify the payment record and supporting documents, and provide the pending remedy or a written reason for non-payment.\n\nReference number: " + referenceNumber;
}
