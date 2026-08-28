from fastapi.testclient import TestClient


def valid_answers() -> dict[str, bool]:
    return {
        "eKycComplete": True,
        "bankAadhaarSeeded": True,
        "npciMappingActive": True,
        "landRecordNameMatch": True,
    }


def test_diagnose_ready_to_file_contract(client: TestClient) -> None:
    response = client.post("/diagnose", json=valid_answers())

    assert response.status_code == 200
    assert response.json()["outcome"] == "ready_to_file"
    assert response.json()["failedCheck"] is None
    assert "recommendedDepartment" in response.json()


def test_diagnose_rejects_incomplete_request(client: TestClient) -> None:
    response = client.post("/diagnose", json={"eKycComplete": True})

    assert response.status_code == 422


def test_category_diagnose_endpoint_accepts_domain_specific_answers(
    client: TestClient,
) -> None:
    response = client.post(
        "/diagnose/epfo_claim_rejected",
        json={
            "answers": {
                "nameMatchesRecords": True,
                "dateOfBirthMatches": True,
                "bankAccountLinkedToUan": False,
                "employerUpdatedDateOfExit": True,
            }
        },
    )

    assert response.status_code == 200
    assert response.json()["failedCheck"] == "bankAccountLinkedToUan"
    assert "bank" in response.json()["actionableFix"].lower()


def test_category_diagnose_endpoint_rejects_missing_answers(client: TestClient) -> None:
    response = client.post(
        "/diagnose/scholarship_nsp_payment_stuck",
        json={"answers": {"eKycAadhaarSeeded": True}},
    )

    assert response.status_code == 422


def test_category_diagnose_endpoint_rejects_unknown_answer_fields(
    client: TestClient,
) -> None:
    response = client.post(
        "/diagnose/income_tax_refund_delayed",
        json={
            "answers": {
                "itrMatchesAis26as": True,
                "hasSection245Demand": False,
                "itrVerified": True,
                "guessedFrontendField": True,
            }
        },
    )

    assert response.status_code == 422
    assert "Unexpected diagnostic answers" in response.json()["detail"]


def test_diagnostic_rules_endpoint_returns_ui_shaped_rules(client: TestClient) -> None:
    response = client.get("/diagnostic-rules/pm_kisan_payment_failure")

    assert response.status_code == 200
    body = response.json()
    assert body["category"] == "pm_kisan_payment_failure"
    assert len(body["questions"]) == 4
    first = body["questions"][0]
    assert first["key"] == "eKycComplete"
    assert first["blockingAnswer"] == "no"
    assert first["fixItems"]
    assert "department" in body["routing"]


def test_diagnostic_rules_list_exposes_all_categories(client: TestClient) -> None:
    response = client.get("/diagnostic-rules")

    assert response.status_code == 200
    assert len(response.json()) == 5


def test_openapi_exposes_all_four_grievance_category_values(
    client: TestClient,
) -> None:
    schema = client.get("/openapi.json").json()

    assert schema["components"]["schemas"]["GrievanceCategory"]["enum"] == [
        "pm_kisan_payment_failure",
        "epfo_claim_rejected",
        "income_tax_refund_delayed",
        "scholarship_nsp_payment_stuck",
        "nrega_wage_delayed",
    ]
    assert schema["components"]["schemas"]["CaseCreate"]["properties"]["category"][
        "enum"
    ] == [
        "pm_kisan_payment_failure",
        "epfo_claim_rejected",
        "income_tax_refund_delayed",
        "scholarship_nsp_payment_stuck",
        "nrega_wage_delayed",
    ]


def test_route_endpoint_returns_explainable_match(client: TestClient) -> None:
    response = client.post(
        "/route",
        json={
            "category": "epfo_withdrawal",
            "issueDescription": "My UAN is not allowing PF withdrawal.",
        },
    )

    assert response.status_code == 200
    assert response.json()["matchedRule"] == "epfo"
    assert response.json()["department"] == "EPFO Regional PF Commissioner Office"
    assert "UAN" in response.json()["reason"]


def test_unknown_evidence_category_is_domain_error(client: TestClient) -> None:
    response = client.post(
        "/evidence-check", json={"category": "unknown", "evidence": {}}
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "No evidence rule is configured for category 'unknown'."
    }


def test_health_and_security_headers(client: TestClient) -> None:
    response = client.get("/health")



def test_unknown_evidence_category_is_domain_error(client: TestClient) -> None:
    response = client.post(
        "/evidence-check", json={"category": "unknown", "evidence": {}}
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "No evidence rule is configured for category 'unknown'."
    }


def test_health_and_security_headers(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "NyayaFlow-engine"}
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert "content-security-policy" in response.headers
    assert "default-src 'self'" in response.headers["content-security-policy"]
    assert "x-request-id" in response.headers



def test_cors_allows_configured_local_frontend(client: TestClient) -> None:
    response = client.options(
        "/diagnose",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_root_index_serves_html(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "NyayaFlow" in response.text
