# NyayaFlow UI Overhaul — Design Spec

**Date:** 2026-08-27
**Goal:** Visual overhaul / modernization in a **Bold & friendly (gov-tech)** aesthetic, applied to all 7 flow screens + the app shell.

## Principles

- **Audience:** low-literacy citizens. Maximize clarity, big touch targets (min 48px), friendly tone, strong visual hierarchy.
- **Trust:** keep the existing saffron/teal/cream base; expand and brighten it.
- **No new runtime dependencies.** Illustrations = inline SVG. PWA/offline-safe.
- **Preserve behavior:** flow state machine in `app/page.tsx`, i18n (EN/TA), `lib/api.ts` + `lib/mockApi.ts` clients, and all existing tests must stay green.

## New design system

### Color (extend `tailwind.config.ts`)
- Keep: `ink #152B2B`, `cream #F6F2E9`, `paper #FFFDF8`, `saffron #E8793B`, `teal #0F766E`, `moss #DDE9DF`, `mist #E7EFEC`.
- Add/extend:
  - `saffronSoft` `#FCE9DC` (light tint fills)
  - `tealSoft` `#D7ECE9`
  - `coral` `#F2603C` (brighter CTA accent)
  - `leaf` `#2F9E6E` (success)
  - `sunrise` gradient: `linear-gradient(135deg,#E8793B 0%,#0F766E 100%)` (hero/CTA)
  - `inkSoft` `#3A4F4F` (secondary text on light)
- Keep `color-scheme: light`.

### Typography (extend scale, bump sizes)
- Keep Plus Jakarta Sans.
- New scale (mobile-first, larger):
  - `display`: text-3xl sm:text-4xl, font-black, tracking-tight
  - `h1`: text-2xl sm:text-3xl, font-extrabold
  - `h2`: text-xl sm:text-2xl, font-extrabold
  - `body`: text-base (was sm), leading-7
  - `caption`: text-sm, font-semibold, text-ink/60
- Headings get `tracking-[-0.02em]`.

### Radius & elevation
- Cards: `rounded-3xl`. Buttons/pills: `rounded-2xl`. Inputs: `rounded-2xl`.
- `shadow-card` (existing) + new `shadow-lift` `0 12px 32px rgba(21,43,43,0.10)` for raised/interactive.
- Borders: `border-ink/10` → `border-ink/15` default; interactive `hover:border-teal`.

### Primitives (new file `components/ui/`)
Create a cohesive set used by every screen:

- **`Button`** (`components/ui/Button.tsx`): variants `primary` (ink→teal on hover, or sunrise), `accent` (saffron/coral), `ghost` (border), `soft` (moss/tealSoft bg). Sizes `lg` (min-h-14), `md` (min-h-12). Full-width by default on mobile. `Icon` support. `focus-ring`.
- **`Card`** (`components/ui/Card.tsx`): `rounded-3xl border bg-paper shadow-card`, `interactive` prop for hover-lift.
- **`Field` / `Input`** (`components/ui/Field.tsx`): label + input/select/textarea wrapper with consistent `inputClass`, error state (`aria-invalid`, saffron ring). Min height 48px.
- **`Pill`** (`components/ui/Pill.tsx`): rounded-full tag; states `default | active | success | warning`.
- **`Stepper`** (`components/ui/Stepper.tsx`): replaces the inline progress in `AppShell`; illustrated, friendlier, with check icons for completed stages.
- **`IllustratedIcon`** (extend `components/Icons.tsx`): bigger, friendlier glyphs for categories + steps; add `document`, `phone`, `gavel`, `rupee`, `clock`, `celebrate` as needed.

All primitives must accept `className` and forward refs where appropriate, and remain SSR-safe (no client-only browser APIs).

### Motion (Phase 5)
- Respect `prefers-reduced-motion`.
- Entrance: subtle `fade + translate-y` on step change (wrapped in `AppShell` section or a `MotionStage` helper).
- Transitions on buttons/cards via Tailwind `transition`.

## Files touched (by phase)

- **Phase 1:** `tailwind.config.ts`, `app/globals.css`, new `components/ui/*`, extend `components/Icons.tsx`.
- **Phase 2:** `components/AppShell.tsx` (use `Stepper`), `components/CategoryPicker.tsx` (use `Card` + illustrated icons), `components/IntakeStep.tsx` (use `Field`/`Button`).
- **Phase 3:** `components/DiagnosticStep.tsx`, `components/ComplaintDraftStep.tsx`.
- **Phase 4:** `components/EvidenceStep.tsx`, `components/SubmissionStep.tsx`, `components/ResolutionStep.tsx`, `components/Timeline.tsx`, `components/StatusTranslator.tsx`.
- **Phase 5:** cross-cutting animation/states/a11y; final `npm run typecheck && npm run lint && npm test -- --run && npm run build`.

## Definition of done (per phase)
- `npm run typecheck` clean
- `npm run lint` clean
- `npm test -- --run` green (existing tests pass; add/adjust tests only if a primitive's contract changes)
- Visual review: bolder, friendlier, larger, consistent with primitives
- Reviewer subagent signs off

## Out of scope
- Backend/API changes, new flows, new locales, auth, persistence beyond what exists.
