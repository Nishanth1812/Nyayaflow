# NyayaFlow-engine Design

## Purpose

NyayaFlow-engine is a locally runnable FastAPI backend for a hackathon demonstration of an Indian government grievance assistant. Its primary journey diagnoses, routes, files, tracks, and—when necessary—appeals a PM-KISAN payment grievance. Every decision is deterministic and returns a plain-language explanation tied to an explicit rule.

## Scope

The service uses Python 3.11+, FastAPI, Pydantic, SQLAlchemy, SQLite, Uvicorn, and pytest. It contains no authentication, external government integrations, asynchronous job system, AI/ML components, or additional infrastructure.

The project lives directly in the current `NyayaFlow` workspace. The public API uses camelCase JSON field names and explicit request and response schemas so frontend types can be generated from OpenAPI.

## Architecture

The application uses a small layered structure:

- `app/routers/` defines HTTP endpoints, validation boundaries, status codes, and database dependency usage.
- `app/services/` contains pure or narrowly stateful deterministic business rules.
- `app/schemas.py` contains explicit Pydantic request and response contracts.
- `app/models.py` contains the SQLAlchemy `Case` model and internal-only `routing_correct` metric field.
- `app/database.py` configures SQLite, sessions, and schema creation.
- `app/seed.py` inserts four fictional demonstration cases only when no cases exist.
- `app/main.py` owns application startup, CORS, router registration, and health reporting.

SQLite JSON columns store diagnostic answers, evidence, and ordered timeline entries. Datetimes are timezone-aware UTC values serialized as ISO 8601 timestamps.

## Deterministic Engines

### Diagnosis

The diagnostic service evaluates `eKycComplete`, `bankAadhaarSeeded`, `npciMappingActive`, and `landRecordNameMatch` in exactly that order. It returns immediately on the first false value. Each outcome includes `outcome`, `failedCheck`, `reason`, `actionableFix`, and `recommendedDepartment`; the department is populated only when all checks pass.

### Routing

Routing uses a readable ordered table of case-insensitive keyword rules. PM-KISAN routing requires both a PM-KISAN/farmer context and a payment/instalment context. EPFO, Income Tax, and Pension rules follow in explicit order. The fallback is `General CPGRAMS — needs manual categorization`. Results expose the matching rule and a human-readable reason naming representative matched keywords.

Category text and issue description are both considered. Explicit domain-specific rules precede broader keyword rules to avoid a generic word such as `payment` taking precedence.

### Evidence

The evidence service maps categories to ordered required-field lists. For `pm_kisan_payment_failure`, it requires Aadhaar, PM-KISAN registration number, bank account proof, and payment status screenshot. The response lists required, present, and missing items and explains the deterministic completeness calculation. Unknown categories return an HTTP 400 error because no evidence rule exists.

### Resolution and Appeal

Citizen confirmation accepts `yes`, `partial`, `no`, or `wrong_dept`. A `yes` or `partial` answer is stored without changing status. A `no` or `wrong_dept` answer produces a deterministic appeal string containing the case ID, original complaint, routed department, relevant timeline dates, current status before appeal, citizen response, and missing remedy. It changes status to `appealed`, updates the plain-language status, and appends an appeal event.

Repeated confirmation with `no` or `wrong_dept` replaces the stored draft but does not append duplicate consecutive appeal events.

## Case Lifecycle

New cases always start as `submitted`, `not_asked`, and without an appeal draft. The service supplies the submitted status explanation and first timeline entry.

The demo advance endpoint permits only:

`submitted → routed → under_process → disposed`

Every transition updates both machine and citizen-friendly status and appends one timeline event. `disposed` and `appealed` cannot advance and return HTTP 400. Unknown IDs return HTTP 404.

Although the seed-data description calls the unresolved example “disposed,” the appeal invariant takes precedence: the seeded unresolved case ends in `appealed`, with a preceding `disposed` event. This visibly demonstrates that administrative disposal did not equal citizen resolution.

## Metrics

Metrics are calculated from persisted cases:

- `totalCases`: all cases.
- `correctlyRoutedPercentage`: percentage whose internal `routing_correct` value is true; this field is excluded from case response schemas.
- `citizenConfirmedResolutionRate`: percentage of answered cases whose answer is `yes`; `not_asked` is excluded from the denominator.
- `averageTimeToFirstResponseMinutes`: average elapsed minutes from `submitted` to the first later timeline event. Cases without a later event are excluded; no qualifying cases returns `0.0`.

## API and Errors

Required endpoints are `/diagnose`, `/route`, `/evidence-check`, `/cases`, `/cases/{id}`, `/cases/{id}/advance-status`, `/cases/{id}/status`, `/cases/{id}/confirm-resolution`, `/metrics`, and `/health`. Swagger remains at `/docs`.

Pydantic produces HTTP 422 for invalid shapes or enum values. Domain errors use HTTP 400. Missing cases use HTTP 404. Common Vite and React localhost origins are allowed by CORS.

## Seed Data

Startup inserts exactly four entirely fictional cases when the table is empty:

1. A correctly routed PM-KISAN payment case under process.
2. A PM-KISAN case that was disposed, confirmed unresolved, and appealed.
3. An EPFO/UAN withdrawal case.
4. An Income Tax refund case.

Seed records contain no Aadhaar number, bank details, phone number, or other sensitive identifier.

## Testing and Verification

Tests exercise pure services and real FastAPI routes against isolated SQLite data. They cover the ten required behaviors plus errors, OpenAPI registration, seed idempotence, internal-field hiding, and status translation.

Completion requires a fresh full pytest run, import/compile checks, database creation and seed verification, application startup, `/docs` retrieval, and confirmation that every required route is present in the generated OpenAPI schema.
