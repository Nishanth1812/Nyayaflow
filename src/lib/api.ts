import type {
  Category,
  DiagnosticAnswers,
  DiagnosticResult,
  DiagnosticRulesResponse,
  EvidenceState,
  OfficialStatus,
  RoutingDecision,
  SubmissionData,
  TimelineEvent,
  TimelineKey,
} from "./mockApi";

/**
 * API base resolution for Vercel combined deployment:
 * - Local dev (Next.js :3000 + FastAPI :8000): NEXT_PUBLIC_API_BASE=http://localhost:8000
 * - Vercel prod (same origin, vercel.json routes /health etc. → api/index.py):
 *   leave NEXT_PUBLIC_API_BASE unset, which produces relative fetch URLs.
 *   An explicit empty string also preserves same-origin requests.
 */
const API_BASE = (() => {
  const envBase = process.env.NEXT_PUBLIC_API_BASE;
  if (envBase !== undefined) return envBase;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") {
      return "http://localhost:8000";
    }
  }
  return "";
})();

/**
 * Normalise path for `/api` prefix compatibility:
 * vercel.json supports both `/cases` and `/api/cases` → api/index.py.
 * If API_BASE ends with `/api`, strip duplicate prefix.
 */
function resolvePath(path: string): string {
  if (API_BASE.endsWith("/api") && path.startsWith("/api/")) {
    return path;
  }
  return path;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const resolvedPath = resolvePath(path);
  const url = `${API_BASE}${resolvedPath}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`NyayaFlow API ${res.status}: ${detail}`);
  }
  return (await res.json()) as T;
}

export function fetchDiagnosticRules(category: Category): Promise<DiagnosticRulesResponse> {
  return request<DiagnosticRulesResponse>(`/diagnostic-rules/${category}`);
}

export function diagnoseCategory(
  category: Category,
  answers: DiagnosticAnswers,
): Promise<DiagnosticResult> {
  return request<{
    outcome: DiagnosticResult["outcome"];
    failedCheck: string | null;
    reason: string;
    recommendedDepartment: string | null;
  }>(`/diagnose/${category}`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  }).then((data) => ({
    outcome: data.outcome,
    failedCheck: data.failedCheck ?? undefined,
    reason: data.reason,
    recommendedDepartment: data.recommendedDepartment ?? undefined,
  }));
}

export function routeIssue(
  category: Category,
  issueDescription: string,
): Promise<RoutingDecision> {
  return request<RoutingDecision>("/route", {
    method: "POST",
    body: JSON.stringify({ category, issueDescription }),
  });
}

export type BackendEvidenceItem = { type: string; description: string; present: boolean };

export type BackendCase = {
  id: number;
  category: string;
  complaintText: string;
  diagnosticAnswers: Record<string, boolean>;
  status: string;
  statusPlainLanguage: string;
  routedDepartment: string;
  routingReason: string;
  evidence: BackendEvidenceItem[];
  timeline: { stage: string; timestamp: string; note: string }[];
  citizenConfirmed: string;
  appealDraft: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCaseInput = {
  category: Category;
  complaintText: string;
  diagnosticAnswers: DiagnosticAnswers;
  routedDepartment: string;
  routingReason: string;
  evidence: BackendEvidenceItem[];
};

export function createCase(input: CreateCaseInput): Promise<BackendCase> {
  return request<BackendCase>("/cases", {
    method: "POST",
    body: JSON.stringify({
      category: input.category,
      complaintText: input.complaintText,
      diagnosticAnswers: input.diagnosticAnswers,
      routedDepartment: input.routedDepartment,
      routingReason: input.routingReason,
      evidence: input.evidence,
    }),
  });
}

export function confirmResolution(
  caseId: number,
  confirmation: string,
): Promise<{ appealDraft: string | null }> {
  return request<{ appealDraft: string | null }>(
    `/cases/${caseId}/confirm-resolution`,
    {
      method: "POST",
      body: JSON.stringify({ citizenConfirmed: confirmation }),
    },
  );
}

export function fetchMetrics(): Promise<{
  totalCases: number;
  correctlyRoutedPercentage: number;
  citizenConfirmedResolutionRate: number;
  averageTimeToFirstResponseMinutes: number;
}> {
  return request("/metrics");
}

const PM_EVIDENCE_MAP: Record<string, string> = {
  beneficiaryId: "aadhaar",
  paymentDates: "pmKisanRegistrationNumber",
  paymentScreenshot: "paymentStatusScreenshot",
  bankReference: "bankAccountProof",
};

export function buildEvidenceItems(
  category: Category,
  evidence: EvidenceState,
): BackendEvidenceItem[] {
  return (Object.entries(evidence) as [string, boolean][]).map(([key, present]) => ({
    type: category === "pm_kisan_payment_failure" ? PM_EVIDENCE_MAP[key] ?? key : key,
    description: key,
    present,
  }));
}

const STAGE_LABELS: Record<string, string> = {
  submitted: "Submitted",
  routed: "Routed to department",
  under_process: "Under review",
  disposed: "Closed by department",
  appealed: "Appeal filed",
};

function stageToTimelineKey(stage: string): TimelineKey {
  switch (stage) {
    case "routed":
      return "routed";
    case "under_process":
      return "window";
    case "disposed":
      return "reminder";
    case "appealed":
      return "appeal";
    default:
      return "submitted";
  }
}

function mapStatusToOfficial(status: string): OfficialStatus {
  switch (status) {
    case "under_process":
      return "Under process";
    case "disposed":
      return "Disposed";
    case "routed":
    case "submitted":
      return "Sent to department";
    case "appealed":
      return "Awaiting clarification";
    default:
      return "Under process";
  }
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function adaptCaseToSubmission(backendCase: BackendCase): SubmissionData {
  const timeline: TimelineEvent[] = backendCase.timeline.map((event) => ({
    key: stageToTimelineKey(event.stage),
    label: STAGE_LABELS[event.stage] ?? event.stage,
    detail: event.note,
    state: event.stage === backendCase.status ? "current" : "complete",
  }));
  return {
    referenceNumber: `NYF-${backendCase.id}`,
    status: mapStatusToOfficial(backendCase.status),
    currentStage: timeline[timeline.length - 1]?.key ?? "submitted",
    submittedOn: formatDate(backendCase.createdAt),
    timeline,
  };
}
