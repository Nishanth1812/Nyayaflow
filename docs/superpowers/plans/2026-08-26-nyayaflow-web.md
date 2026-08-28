# NyayaFlow Citizen PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished mobile-first Next.js/Tailwind PWA in `web/` that guides a citizen from a PM-KISAN payment-failure complaint through diagnosis, filing, evidence preparation, status translation, and unresolved-resolution appeal.

**Architecture:** Keep the existing FastAPI engine unchanged and add a self-contained Next.js App Router app under `web/`. `web/app/page.tsx` owns cross-screen React state, focused components render each screen, and `web/lib/mockApi.ts` is the only source of backend-shaped demo data and deterministic rules. `web/lib/i18n.ts` owns English/Tamil UI copy.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Testing Library, Node 20+.

**Spec:** `docs/superpowers/specs/2026-08-26-nyayaflow-web-design.md`

## Global Constraints

- The frontend lives in `web/` alongside the existing FastAPI backend.
- No localStorage, backend DB, authentication, external government integration, analytics, or real upload.
- All diagnostic logic, routing results, complaint text, evidence scores, status values, timeline data, and appeal templates come from `web/lib/mockApi.ts`.
- English and Tamil UI strings live in one `web/lib/i18n.ts` object and switching language never resets flow state.
- Use large tap targets, explicit labels, keyboard-reachable controls, visible focus states, and text explanations that do not rely on color alone.
- The default demo path reaches a `Disposed` status so resolution verification and appeal generation are visible.
- Avoid adding image dependencies; use inline SVG icons and CSS shapes for the visual system.
- Do not modify the existing Python `app/` directory or its tests.

---

### Task 1: Frontend foundation and deterministic mock seam

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/next-env.d.ts`
- Create: `web/next.config.ts`
- Create: `web/postcss.config.mjs`
- Create: `web/tailwind.config.ts`
- Create: `web/vitest.config.ts`
- Create: `web/vitest.setup.ts`
- Create: `web/app/layout.tsx`
- Create: `web/app/globals.css`
- Create: `web/app/manifest.ts`
- Create: `web/lib/i18n.ts`
- Create: `web/lib/mockApi.ts`
- Create: `web/lib/mockApi.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces `getDemoIntake(): IntakeData`, `diagnose(answers: DiagnosticAnswers): DiagnosticResult`, `getRoutingDecision(input: RoutingInput): RoutingDecision`, `createComplaintDraft(input: DraftInput): string`, `scoreEvidence(evidence: EvidenceState): EvidenceScore`, `createSubmission(input: SubmissionInput): SubmissionData`, `translateStatus(status: OfficialStatus): string`, and `createAppeal(input: AppealInput): string`.
- Produces `Dictionary`, `Locale`, and typed diagnostic/evidence/status contracts consumed by all UI components.

- [ ] **Step 1: Write failing tests for the backend-shaped seam**

Create tests that assert the first failed diagnostic is selected, all-yes diagnosis recommends the PM-KISAN department, the PM-KISAN routing reason mentions instalments and land records, evidence scoring counts four required items, all four required statuses translate exactly, and an unresolved appeal includes the original complaint and missing remedy.

```ts
it("stops diagnosis at the first No", () => {
  expect(diagnose({ eKycComplete: false, bankAadhaarSeeded: false, npciMappingActive: true, landRecordNameMatch: true }).failedCheck).toBe("eKycComplete");
});

it("routes the PM-KISAN complaint with an explainable reason", () => {
  const result = getRoutingDecision({ category: "pm_kisan_payment_failure", issueDescription: "My PM-KISAN instalment stopped after two payments." });
  expect(result.department).toContain("PM-KISAN");
  expect(result.reason.toLowerCase()).toContain("instalment");
});

it("translates every official status", () => {
  expect(translateStatus("Disposed")).toContain("does not necessarily mean payment");
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `cd web; npm test -- --run lib/mockApi.test.ts`

Expected: the test command cannot resolve `lib/mockApi` because the app seam has not been implemented.

- [ ] **Step 3: Scaffold the Next.js/Tailwind/Vitest foundation**

Add a minimal Next App Router package with scripts `dev`, `build`, `start`, `lint`, `typecheck`, and `test`. Configure Tailwind, Vitest with a jsdom environment, and a manifest with the NyayaFlow name, theme color, and standalone display. The root layout sets the metadata, language, viewport theme, and imports global styles.

- [ ] **Step 4: Implement typed translations and mock API data**

Define English and Tamil strings for the header, progress labels, intake prompts, field labels, diagnostic questions, fix cards, draft, evidence, timeline, status translator, and resolution choices. Implement deterministic mock functions with no React imports and no browser persistence. The default intake and submission data must be fictional.

- [ ] **Step 5: Run the focused tests and typecheck**

Run: `cd web; npm test -- --run lib/mockApi.test.ts; npm run typecheck`

Expected: all mock API tests pass and TypeScript reports no errors.

- [ ] **Step 6: Commit the foundation slice**

```powershell
git add .gitignore web docs/superpowers/plans/2026-08-26-nyayaflow-web.md
git commit -m "feat: add NyayaFlow web foundation and mock seam"
```

### Task 2: Shell, intake, language toggle, and diagnostic tree

**Files:**
- Create: `web/components/Icons.tsx`
- Create: `web/components/AppShell.tsx`
- Create: `web/components/IntakeStep.tsx`
- Create: `web/components/DiagnosticStep.tsx`
- Create: `web/components/StepHeading.tsx`
- Create: `web/components/IntakeStep.test.tsx`
- Create: `web/components/DiagnosticStep.test.tsx`
- Create: `web/app/page.tsx`
- Modify: `web/app/globals.css`

**Interfaces:**
- `AppShell` consumes `{ locale, dictionary, currentStage, onLocaleChange, onBack, children }` and produces a persistent header/progress frame.
- `IntakeStep` consumes the intake value object and callbacks for text, voice sample, fields, and continue.
- `DiagnosticStep` consumes `DiagnosticCheck`, current answer, and callbacks for answer/continue.
- `page.tsx` produces the `FlowStep` state machine and preserves all entered values across back/forward transitions.

- [ ] **Step 1: Write component tests for the first two stages**

Test that clicking the voice button inserts the sample complaint, intake controls expose labels, the diagnostic component shows one question at a time, and a `No` result renders the supplied fix checklist instead of advancing.

- [ ] **Step 2: Run component tests to verify the new components are absent**

Run: `cd web; npm test -- --run components/IntakeStep.test.tsx components/DiagnosticStep.test.tsx`

Expected: test collection fails because the component modules do not exist.

- [ ] **Step 3: Implement the app shell and visual tokens**

Create the mobile shell with safe-area padding, warm background, sticky header, compact NyayaFlow mark, language toggle, current-step label, seven-dot progress indicator, and a back affordance that is hidden on the intake screen. Add CSS tokens for ink, cream, saffron, teal, and accessible focus rings.

- [ ] **Step 4: Implement the intake screen and diagnostic state machine**

Build the chat-style intake with a user message bubble, assistant prompt, sample voice action, complaint textarea, beneficiary ID/state/date fields, and a large continue button. In `page.tsx`, initialize the fictional defaults, require complaint/beneficiary/state/date before continuing, then call `diagnose` to select each ordered check. Render the supplied fix-it card for `No`, keep the diagnostic answer in state, and move forward only after the user acknowledges the checklist.

- [ ] **Step 5: Run tests, lint, and typecheck for the slice**

Run: `cd web; npm test -- --run components/IntakeStep.test.tsx components/DiagnosticStep.test.tsx; npm run lint; npm run typecheck`

Expected: tests pass, lint has zero errors, and typecheck passes.

- [ ] **Step 6: Commit the intake and diagnostic slice**

```powershell
git add web/app web/components web/lib
git commit -m "feat: add guided intake and diagnostic flow"
```

### Task 3: Complaint draft and evidence checklist

**Files:**
- Create: `web/components/ComplaintDraftStep.tsx`
- Create: `web/components/EvidenceStep.tsx`
- Create: `web/components/ComplaintDraftStep.test.tsx`
- Create: `web/components/EvidenceStep.test.tsx`
- Modify: `web/app/page.tsx`

**Interfaces:**
- `ComplaintDraftStep` consumes `{ draft, routing, departments, selectedDepartment, onDraftChange, onDepartmentChange, onContinue }`.
- `EvidenceStep` consumes `{ evidence, score, onToggle, onMockUpload, onContinue }`.
- `page.tsx` consumes `createComplaintDraft`, `getRoutingDecision`, and `scoreEvidence` from `mockApi.ts`; no routing or evidence rules are duplicated in components.

- [ ] **Step 1: Write failing component tests**

Assert that the routing explanation names the department and reason, the draft is editable, toggling an evidence row increases the completeness score, and the screenshot action shows an attached placeholder.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `cd web; npm test -- --run components/ComplaintDraftStep.test.tsx components/EvidenceStep.test.tsx`

Expected: test collection fails because these components do not exist.

- [ ] **Step 3: Implement the draft screen**

Render a generated complaint inside a readable textarea, an explainable “why this department” card, a native department select with PM-KISAN and fallback options, and a continue action. Preserve edits in page state and use the selected department when creating the submission.

- [ ] **Step 4: Implement the evidence screen**

Render four large checklist rows for beneficiary ID, payment dates, payment-status screenshot, and bank reference. Connect each row to `scoreEvidence`, show a teal-to-saffron progress bar with a numeric percentage and plain-language completeness copy, and keep the upload action as an in-memory placeholder.

- [ ] **Step 5: Run focused tests, lint, and typecheck**

Run: `cd web; npm test -- --run components/ComplaintDraftStep.test.tsx components/EvidenceStep.test.tsx; npm run lint; npm run typecheck`

Expected: all focused tests pass with no lint or type errors.

- [ ] **Step 6: Commit the filing-preparation slice**

```powershell
git add web/app/page.tsx web/components
git commit -m "feat: add complaint drafting and evidence checklist"
```

### Task 4: Submission, timeline, status translation, and resolution verification

**Files:**
- Create: `web/components/StatusTranslator.tsx`
- Create: `web/components/Timeline.tsx`
- Create: `web/components/SubmissionStep.tsx`
- Create: `web/components/ResolutionStep.tsx`
- Create: `web/components/StatusTranslator.test.tsx`
- Create: `web/components/ResolutionStep.test.tsx`
- Modify: `web/app/page.tsx`

**Interfaces:**
- `StatusTranslator` consumes `{ status, statuses, onStatusChange }` and displays `translateStatus(status)`.
- `Timeline` consumes `TimelineEvent[]` and a current stage key.
- `SubmissionStep` consumes `SubmissionData`, the status translator state, and a callback to open resolution verification.
- `ResolutionStep` consumes the complaint, department, status, current outcome, and `onOutcome`; it displays `createAppeal` output for unresolved or wrong-department outcomes.

- [ ] **Step 1: Write failing tests for translation and appeal states**

Test that `Disposed` renders its cautionary explanation, choosing `No still unresolved` exposes an appeal draft containing the original complaint and missing remedy, and choosing `Yes resolved` renders a confirmation without an appeal.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `cd web; npm test -- --run components/StatusTranslator.test.tsx components/ResolutionStep.test.tsx`

Expected: test collection fails because the components do not exist.

- [ ] **Step 3: Implement the timeline and submission confirmation**

Use `createSubmission` to show a fictional reference number, success badge, next-step note, and a responsive vertical mobile/horizontal wide-screen timeline. Highlight the current `Disposed` stage and keep the six lifecycle milestones visible.

- [ ] **Step 4: Implement the status translator**

Provide a large native select with all four official statuses. Render the exact plain-language mapping below it and visually separate the official phrase from the citizen explanation.

- [ ] **Step 5: Implement resolution verification and appeal draft**

Show the payment-received question with five large options. Use `createAppeal` for `no` and `wrong_dept`; show the generated draft in a copyable/editable textarea card. For resolved or partial outcomes, show a calm confirmation card. For help-understanding, keep the translated status explanation as the primary action.

- [ ] **Step 6: Wire the complete flow and run tests**

Update `page.tsx` so the evidence continue action creates submission data, the submission screen can open resolution verification, back navigation works, status changes remain in memory, and the language toggle updates all visible labels. Run:

`cd web; npm test -- --run components/StatusTranslator.test.tsx components/ResolutionStep.test.tsx; npm run lint; npm run typecheck`

Expected: focused tests pass, lint has zero errors, and typecheck passes.

- [ ] **Step 7: Commit the complete guided flow**

```powershell
git add web/app/page.tsx web/components
git commit -m "feat: complete submission status and appeal journey"
```

### Task 5: Full verification and handoff documentation

**Files:**
- Modify: `web/app/layout.tsx` if metadata needs adjustment
- Modify: `README.md`
- Modify: `.gitignore` only if verification finds an omission

**Interfaces:**
- Produces a documented local frontend command sequence and a verifiable production build.

- [ ] **Step 1: Run the full frontend test and static checks**

Run: `cd web; npm test -- --run; npm run lint; npm run typecheck; npm run build`

Expected: all tests pass, lint/typecheck are clean, and the production build exits with code 0.

- [ ] **Step 2: Start the app for browser verification**

Run: `cd web; npm run dev -- --hostname 127.0.0.1`

Open the reported local URL in the in-app browser at a narrow mobile viewport. Verify the intake voice sample, required-field validation, Tamil toggle, a diagnostic `No` checklist branch, all-yes continuation, editable draft, evidence score, submission reference, timeline, each status translation, and unresolved appeal draft. Capture any runtime console or hydration errors and fix them before continuing.

- [ ] **Step 3: Update README with frontend startup instructions**

Add a concise “Web demo” section that says `cd web`, `npm install`, `npm run dev`, and points to the PWA experience. Keep the existing FastAPI instructions intact.

- [ ] **Step 4: Review the diff for scope and secrets**

Run:

```powershell
git -c safe.directory='H:/Personal/Hackathons/NyayaFlow' diff --check
git -c safe.directory='H:/Personal/Hackathons/NyayaFlow' status --short
git -c safe.directory='H:/Personal/Hackathons/NyayaFlow' diff --stat
```

Inspect that no `.env`, build output, user identifiers, or edits to the Python engine were added.

- [ ] **Step 5: Commit documentation and verification fixes**

```powershell
git add README.md web
git commit -m "docs: document NyayaFlow web demo"
```

## Plan Self-Review

- Spec coverage: the plan includes the intake fields and voice sample, ordered diagnostic questions and negative fix cards, editable routed complaint, evidence score, timeline, exact status translations, resolution choices, unresolved appeal template, English/Tamil toggle, mobile-first visuals, mock-only data, and browser verification.
- Placeholder scan: no step relies on “TBD,” “TODO,” or unspecified behavior; every test and command names concrete files or outcomes.
- Type consistency: the mock seam types are introduced before components consume them; each component interface names its input object and page state remains the only cross-step coordinator.
- Scope: the existing FastAPI backend is explicitly preserved; the plan creates one independent frontend subsystem with its own test/build loop.
