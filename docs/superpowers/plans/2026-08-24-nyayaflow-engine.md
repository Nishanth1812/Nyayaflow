# NyayaFlow-engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, deterministic, locally runnable FastAPI grievance backend with seeded SQLite data, explicit OpenAPI contracts, and verified demo workflows.

**Architecture:** Thin FastAPI routers validate explicit Pydantic schemas and delegate decisions to focused service functions. SQLAlchemy persists cases in SQLite, including JSON diagnostic/evidence/timeline fields, while startup creates and seeds the schema idempotently.

**Tech Stack:** Python 3.11+, FastAPI, Pydantic 2, SQLAlchemy 2, SQLite, Uvicorn, pytest, FastAPI TestClient

**Spec:** `docs/superpowers/specs/2026-08-24-nyayaflow-engine-design.md`

## Global Constraints

- Use deterministic ordered rules only; do not add LLMs, ML, embeddings, fuzzy routing, or external government API integrations.
- Expose explicit Pydantic request and response models with camelCase JSON fields.
- Keep Swagger UI available at `/docs` and support localhost origins `http://localhost:3000` and `http://localhost:5173`.
- Store only fictional seed data and no sensitive personal identifiers.
- Run locally with `uvicorn app.main:app --reload`.

---

### Task 1: Project foundation and deterministic rule services

**Files:**
- Create: `.gitignore`
- Create: `requirements.txt`
- Create: `app/__init__.py`
- Create: `app/services/__init__.py`
- Create: `app/services/diagnostic_engine.py`
- Create: `app/services/routing_engine.py`
- Create: `app/services/evidence_checker.py`
- Create: `tests/test_services.py`

**Interfaces:**
- Produces: `diagnose_answers(answers: Mapping[str, bool]) -> dict[str, object]`
- Produces: `route_issue(category: str, issue_description: str) -> dict[str, str]`
- Produces: `check_evidence(category: str, evidence: Mapping[str, bool]) -> dict[str, object]`

- [ ] **Step 1: Write failing service tests**

```python
def test_ekyc_failure_stops_at_first_check():
    result = diagnose_answers({
        "eKycComplete": False,
        "bankAadhaarSeeded": False,
        "npciMappingActive": False,
        "landRecordNameMatch": False,
    })
    assert result["failedCheck"] == "eKycComplete"

def test_uan_routes_to_epfo():
    result = route_issue("general", "My UAN is not allowing PF withdrawal")
    assert result["matchedRule"] == "epfo"

def test_pm_kisan_evidence_is_half_complete():
    result = check_evidence("pm_kisan_payment_failure", {
        "aadhaar": True,
        "pmKisanRegistrationNumber": True,
        "bankAccountProof": False,
        "paymentStatusScreenshot": False,
    })
    assert result["completenessPercentage"] == 50.0
```

- [ ] **Step 2: Run the service tests and verify they fail because the modules do not exist**

Run: `python -m pytest tests/test_services.py -v`
Expected: collection fails with `ModuleNotFoundError` for `app.services`.

- [ ] **Step 3: Add the minimal rule tables and service functions**

Implement the exact diagnostic order and copy, ordered keyword routing with compound PM-KISAN matching, and category evidence requirements. Include `reason` in every result and raise a domain `ValueError` for an unknown evidence category.

- [ ] **Step 4: Run service tests**

Run: `python -m pytest tests/test_services.py -v`
Expected: all service tests pass.

- [ ] **Step 5: Commit the verified slice**

```powershell
git add .gitignore requirements.txt app tests/test_services.py
git commit -m "feat: add deterministic grievance rule engines"
```

### Task 2: Persistence and explicit API schemas

**Files:**
- Create: `app/database.py`
- Create: `app/models.py`
- Create: `app/schemas.py`
- Create: `tests/test_database.py`

**Interfaces:**
- Produces: `Case` SQLAlchemy model with public fields from the spec and internal `routing_correct`
- Produces: `get_db() -> Generator[Session, None, None]`
- Produces: explicit request/response schemas including `CaseResponse`, `CaseCreate`, and all engine contracts

- [ ] **Step 1: Write failing persistence tests**

```python
def test_case_table_stores_json_and_hides_internal_routing_field(db_session):
    case = Case(category="demo", complaint_text="Test", diagnostic_answers={},
                status=CaseStatus.SUBMITTED, status_plain_language="Submitted",
                routed_department="General", routing_reason="Fallback",
                evidence=[], timeline=[], citizen_confirmed=CitizenConfirmation.NOT_ASKED,
                routing_correct=True)
    db_session.add(case)
    db_session.commit()
    payload = CaseResponse.model_validate(case).model_dump(by_alias=True)
    assert payload["diagnosticAnswers"] == {}
    assert "routingCorrect" not in payload
```

- [ ] **Step 2: Run the persistence test and verify failure**

Run: `python -m pytest tests/test_database.py -v`
Expected: collection fails because database, model, and schema modules are absent.

- [ ] **Step 3: Implement SQLAlchemy configuration, enums, model, and Pydantic contracts**

Use SQLAlchemy 2 declarative mappings and JSON columns. Configure Pydantic with `from_attributes=True`, populate-by-name, and camelCase aliases. Ensure enum validation produces standard HTTP 422 responses at API boundaries.

- [ ] **Step 4: Run persistence and service tests**

Run: `python -m pytest tests/test_database.py tests/test_services.py -v`
Expected: all tests pass.

- [ ] **Step 5: Commit the verified slice**

```powershell
git add app/database.py app/models.py app/schemas.py tests/test_database.py
git commit -m "feat: add persistent case model and API contracts"
```

### Task 3: Engine HTTP endpoints and application shell

**Files:**
- Create: `app/routers/__init__.py`
- Create: `app/routers/diagnose.py`
- Create: `app/routers/routing.py`
- Create: `app/routers/evidence.py`
- Create: `app/main.py`
- Create: `tests/conftest.py`
- Create: `tests/test_engine_api.py`

**Interfaces:**
- Produces: `POST /diagnose`, `POST /route`, `POST /evidence-check`, `GET /health`
- Produces: FastAPI `app` with CORS and dependency-overridable database session

- [ ] **Step 1: Write failing endpoint contract tests**

```python
def test_diagnose_ready_to_file(client):
    response = client.post("/diagnose", json={
        "eKycComplete": True, "bankAadhaarSeeded": True,
        "npciMappingActive": True, "landRecordNameMatch": True,
    })
    assert response.status_code == 200
    assert response.json()["outcome"] == "ready_to_file"

def test_unknown_evidence_category_is_domain_error(client):
    response = client.post("/evidence-check", json={"category": "unknown", "evidence": {}})
    assert response.status_code == 400
```

- [ ] **Step 2: Run endpoint tests and verify missing-route failures**

Run: `python -m pytest tests/test_engine_api.py -v`
Expected: tests fail because `app.main` or the requested routes are absent.

- [ ] **Step 3: Add thin routers and application construction**

Bind every route to explicit `response_model` schemas, translate evidence `ValueError` to HTTP 400, add health response, and configure only the specified localhost CORS origins.

- [ ] **Step 4: Run all current tests**

Run: `python -m pytest -v`
Expected: all current tests pass.

- [ ] **Step 5: Commit the verified slice**

```powershell
git add app/main.py app/routers tests/conftest.py tests/test_engine_api.py
git commit -m "feat: expose deterministic engine endpoints"
```

### Task 4: Case lifecycle and deterministic appeals

**Files:**
- Create: `app/services/appeal_generator.py`
- Create: `app/routers/cases.py`
- Create: `tests/test_cases_api.py`

**Interfaces:**
- Produces: `generate_appeal(case: Case, confirmation: CitizenConfirmation) -> str`
- Produces: case create/list/get/status/advance/confirm endpoints
- Consumes: `Case`, `CaseCreate`, `CaseResponse`, database dependency, status-message mapping

- [ ] **Step 1: Write failing lifecycle tests**

```python
def test_case_status_progresses_without_skipping(client):
    created = create_case(client)
    statuses = [client.post(f"/cases/{created['id']}/advance-status").json()["status"]
                for _ in range(3)]
    assert statuses == ["routed", "under_process", "disposed"]
    assert client.post(f"/cases/{created['id']}/advance-status").status_code == 400

def test_disposed_unresolved_case_generates_appeal(client):
    created = create_disposed_case(client)
    response = client.post(f"/cases/{created['id']}/confirm-resolution",
                           json={"citizenConfirmed": "no"})
    assert response.status_code == 200
    assert response.json()["appealGenerated"] is True
    assert response.json()["case"]["status"] == "appealed"
    assert f"Case #{created['id']}" in response.json()["appealDraft"]
```

- [ ] **Step 2: Run lifecycle tests and verify missing-route failures**

Run: `python -m pytest tests/test_cases_api.py -v`
Expected: requests fail with 404 because case routes are not registered.

- [ ] **Step 3: Implement CRUD, strict progression, translation, and appeal generation**

Create cases with server-owned defaults, UTC timeline entries, and plain-language messages. Use a literal transition table. Generate distinct missing-remedy paragraphs for `no` and `wrong_dept`; store confirmation and avoid duplicate consecutive appeal events.

- [ ] **Step 4: Run all current tests**

Run: `python -m pytest -v`
Expected: all tests pass, including 404, 400, and 422 cases.

- [ ] **Step 5: Commit the verified slice**

```powershell
git add app/services/appeal_generator.py app/routers/cases.py app/main.py tests/test_cases_api.py
git commit -m "feat: add case lifecycle and appeal workflow"
```

### Task 5: Metrics and idempotent demo seed data

**Files:**
- Create: `app/routers/metrics.py`
- Create: `app/seed.py`
- Create: `tests/test_metrics.py`
- Create: `tests/test_seed.py`
- Modify: `app/main.py`

**Interfaces:**
- Produces: `GET /metrics -> MetricsResponse`
- Produces: `seed_database(session: Session) -> None`
- Consumes: case timelines, internal `routing_correct`, and citizen confirmation values

- [ ] **Step 1: Write failing metrics and seed tests**

```python
def test_metrics_exclude_not_asked_from_resolution_denominator(client, db_session):
    add_metric_case(db_session, "yes", True)
    add_metric_case(db_session, "no", True)
    add_metric_case(db_session, "not_asked", False)
    payload = client.get("/metrics").json()
    assert payload["citizenConfirmedResolutionRate"] == 50.0

def test_seed_is_idempotent(db_session):
    seed_database(db_session)
    seed_database(db_session)
    assert db_session.query(Case).count() == 4
```

- [ ] **Step 2: Run metrics and seed tests and verify failure**

Run: `python -m pytest tests/test_metrics.py tests/test_seed.py -v`
Expected: collection or requests fail because metrics and seed features are absent.

- [ ] **Step 3: Implement aggregate calculations and four fictional cases**

Exclude `not_asked` from resolution rate and cases without a response event from response-time averaging. Keep `routing_correct` internal. Make the unresolved PM-KISAN seed end in `appealed` after a `disposed` event.

- [ ] **Step 4: Register metrics and startup schema/seed initialization**

Use a FastAPI lifespan context to call `Base.metadata.create_all()` and seed only the configured application database.

- [ ] **Step 5: Run all tests**

Run: `python -m pytest -v`
Expected: all tests pass.

- [ ] **Step 6: Commit the verified slice**

```powershell
git add app/routers/metrics.py app/seed.py app/main.py tests/test_metrics.py tests/test_seed.py
git commit -m "feat: add demo metrics and idempotent seed data"
```

### Task 6: Documentation and release verification

**Files:**
- Create: `README.md`
- Modify: tests only if verification exposes an unprotected regression

**Interfaces:**
- Documents: purpose, architecture, environment setup, startup, database behavior, API inventory, and curl examples

- [ ] **Step 1: Write the concise README**

Document Windows and Linux/macOS virtual environment activation, installation, `uvicorn app.main:app --reload`, `/docs`, SQLite/seed behavior, all endpoints, and representative diagnose/case/confirmation curl requests.

- [ ] **Step 2: Run static import and compile verification**

Run: `python -m compileall -q app tests`
Expected: exit code 0.

- [ ] **Step 3: Run the complete test suite freshly**

Run: `python -m pytest -v`
Expected: zero failures and all ten required behaviors covered.

- [ ] **Step 4: Verify a real application database and seed count**

Run: `python -c "from app.main import app; from app.database import Base, engine, SessionLocal; from app.seed import seed_database; Base.metadata.create_all(engine); s=SessionLocal(); seed_database(s); print(s.query(__import__('app.models', fromlist=['Case']).Case).count()); s.close()"`
Expected: prints `4` on both the first and second execution.

- [ ] **Step 5: Start Uvicorn and check runtime endpoints**

Run the server on a free localhost port, then request `/health`, `/docs`, and `/openapi.json`. Expected: health is HTTP 200 with the service payload, docs is HTTP 200 HTML, and OpenAPI contains every required operation.

- [ ] **Step 6: Review the final diff for requirements, secrets, and unintended fields**

Run: `git diff HEAD~1..HEAD --check` as applicable, `git status --short`, and inspect OpenAPI schemas to confirm `routingCorrect` is absent from normal case responses.

- [ ] **Step 7: Commit documentation**

```powershell
git add README.md
git commit -m "docs: add local setup and API examples"
```
