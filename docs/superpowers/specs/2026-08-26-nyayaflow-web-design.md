# NyayaFlow Citizen PWA Design

## Purpose

Add a polished, mobile-first Next.js/Tailwind PWA demo for a citizen filing a PM-KISAN payment-failure grievance. The experience should make a complex government process feel like a calm, guided chat: one decision at a time, clear next actions, plain-language status translation, and a visible path to appeal when a complaint is administratively disposed without resolving the citizen's problem.

## Scope

The frontend lives in `web/` alongside the existing FastAPI engine. It is intentionally self-contained for the hackathon demo: React state owns the current session, and `web/lib/mockApi.ts` is the single replaceable boundary for all backend-shaped data. There is no browser persistence, authentication, external government integration, or real file upload. The existing Python backend remains untouched.

The supported demo path covers:

1. Intake of a complaint and three clarifying fields.
2. Four ordered PM-KISAN diagnostic checks with a fix-it branch on each negative answer.
3. Generated complaint draft with editable text and department selection.
4. Evidence checklist with a completeness score.
5. Submission confirmation and lifecycle timeline.
6. Official-status translation for the four required status strings.
7. Resolution verification and an appeal draft for unresolved outcomes.

## Experience and Visual Direction

- Use a centered mobile shell on larger screens and a full-bleed layout on small screens.
- Use a warm paper background, deep ink text, saffron/teal accents, rounded cards, soft borders, and compact shadows.
- Keep the visual language conversational and reassuring, adjacent to WhatsApp without copying its branding.
- Use large tap targets, strong focus rings, explicit labels, native controls where possible, and sufficient color contrast.
- Show a persistent header with the NyayaFlow mark, a compact `EN / தமிழ்` language toggle, and a progress indicator across the seven stages.
- Keep copy short on each screen; explain government jargon immediately beside the relevant term.
- Use icons rendered as inline SVG/CSS shapes or text-safe symbols so the app has no image dependency.

## Architecture

`web/app/page.tsx` is the single client entry point. It owns only session state and delegates each stage's presentation to focused components. A `FlowStep` union controls the current screen; transitions are explicit callbacks rather than URL routing so the demo remains one guided flow.

`web/lib/mockApi.ts` is the backend seam. It exports typed functions for intake defaults, diagnosis, routing, draft generation, evidence scoring, submission/timeline state, status translation, and appeal generation. UI components never encode diagnostic rules, status mappings, routing reasons, or appeal templates directly. A future API adapter can replace these functions without changing the screen components.

All translations are stored in one `web/lib/i18n.ts` object with `en` and `ta` branches. Components receive the active dictionary through page-level props or a small typed helper; language switching does not reset the flow state.

## Component Boundaries

- `web/components/AppShell.tsx`: global shell, header, language toggle, progress, back affordance, and content frame.
- `web/components/IntakeStep.tsx`: complaint chat, voice-input sample action, and clarifying fields.
- `web/components/DiagnosticStep.tsx`: one ordered diagnostic question and a negative-answer fix card.
- `web/components/ComplaintDraftStep.tsx`: editable textarea, routing explanation, and department select.
- `web/components/EvidenceStep.tsx`: evidence rows, mock upload action, score bar, and continue action.
- `web/components/SubmissionStep.tsx`: submitted confirmation, reference number, status translator, resolution choices, and timeline.
- `web/components/StatusTranslator.tsx`: official status select and plain-language explanation.
- `web/components/ResolutionStep.tsx`: resolution options and appeal draft state.
- `web/components/Icons.tsx`: small reusable inline SVG icons used by the visual system.
- `web/app/globals.css`: theme tokens, accessible focus treatment, background texture, and safe-area/layout utilities not convenient in Tailwind classes.

Components may contain local presentational state such as an expanded card or selected evidence row. Page state owns all cross-step values: complaint, beneficiary ID, state, last payment date, diagnostic answers, selected department, complaint draft, evidence presence, status, and resolution outcome.

## Flow and Mock Data

The default intake sample is “My PM-KISAN instalment stopped after two payments.” Voice input inserts the same sample text. The clarifying defaults use fictional, non-sensitive demo values.

The diagnostic checks run in this order:

1. `eKycComplete`
2. `bankAadhaarSeeded`
3. `npciMappingActive`
4. `landRecordNameMatch`

The first `No` returns a targeted fix title, checklist, and recommended next step. `Yes` advances to the next question. Reaching the end returns a ready-to-file outcome and department recommendation.

The routing explanation must include the selected department and the reason that PM-KISAN instalments and land-record verification were mentioned. The evidence score is calculated from beneficiary ID, dates, screenshot, and bank reference; the screenshot action is a visible placeholder, not a real upload.

Submission creates a fictional reference number and a timeline with these ordered stages: Submitted, Routed to department, 21-day window, Reminder, Appeal/Escalation, Citizen confirms resolution. The current stage is visually highlighted, and the demo can show the lifecycle in a compact card without requiring a backend call.

Status translation uses exactly these mock mappings:

- `Under process` → `The department has not completed a final action yet.`
- `Disposed` → `The department has closed the complaint; this does not necessarily mean payment or service was received.`
- `Sent to department` → `Your complaint has been routed, but action may not have started.`
- `Awaiting clarification` → `The department may need more information from you.`

The default post-submission status is `Disposed` to make resolution verification and appeal generation visible in the demo. Selecting `No still unresolved` generates an appeal draft referencing the original complaint, the disposed status, and the missing payment remedy. `Yes resolved` and `Partially resolved` show a confirmation state; `Wrong department` generates an appeal/escalation draft; `Need help understanding` keeps the plain-language status card prominent.

## Error and Accessibility Behavior

- The demo never blocks submission because of missing optional values, but required intake fields show inline errors when the user tries to continue.
- The diagnostic action buttons are full-width on mobile and keyboard reachable.
- Every form control has a visible label; placeholders are not the only label.
- Status explanations use text, not color alone.
- Buttons indicate their action in the active language and have `aria-label`s where an icon is the only visual.
- The mock upload action announces a fictional “ready to attach” state without opening a system picker.
- The flow can move backward without losing entered state.

## Testing and Verification

- Add Vitest tests for `web/lib/mockApi.ts` covering diagnostic order, all-four-yes routing, evidence score, all four status mappings, and unresolved appeal text.
- Add component tests for the intake voice sample, diagnostic negative branch, language toggle, and evidence score update where the existing toolchain supports them.
- Run formatting/lint/typecheck and a production build for the Next.js app.
- Start the app and use browser verification at a mobile viewport to confirm the first screen, the diagnostic branch, the submission timeline, the language toggle, and the unresolved appeal path.

## Non-goals

- No real PM-KISAN, Aadhaar, NPCI, bank, land-record, or CPGRAMS integrations.
- No persistent storage, user accounts, backend database, analytics, or real document upload.
- No attempt to fully translate backend legal content beyond the demo UI strings.
- No redesign of the existing FastAPI engine.
