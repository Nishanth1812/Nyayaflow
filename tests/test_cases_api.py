from fastapi.testclient import TestClient


def case_payload() -> dict[str, object]:
    return {
        "category": "pm_kisan_payment_failure",
        "complaintText": "My fictional PM-KISAN instalment has not been credited.",
        "diagnosticAnswers": {
            "eKycComplete": True,
            "bankAadhaarSeeded": True,
            "npciMappingActive": True,
            "landRecordNameMatch": True,
        },
        "routedDepartment": (
            "Ministry of Agriculture and Farmers Welfare (PM-KISAN Cell)"
        ),
        "routingReason": "PM-KISAN and instalment matched the payment routing rule.",
        "evidence": [
            {
                "type": "aadhaar",
                "description": "Aadhaar identity document",
                "present": True,
            }
        ],
    }


def create_case(client: TestClient) -> dict[str, object]:
    response = client.post("/cases", json=case_payload())
    assert response.status_code == 201
    return response.json()


def dispose_case(client: TestClient) -> dict[str, object]:
    case = create_case(client)
    for _ in range(3):
        response = client.post(f"/cases/{case['id']}/advance-status")
        assert response.status_code == 200
        case = response.json()
    return case


def test_create_case_sets_server_owned_defaults_and_timeline(client: TestClient) -> None:
    created = create_case(client)

    assert created["status"] == "submitted"
    assert created["citizenConfirmed"] == "not_asked"
    assert created["appealDraft"] is None
    assert created["statusPlainLanguage"] == (
        "Your complaint has been submitted successfully."
    )
    assert created["timeline"][0]["stage"] == "submitted"
    assert created["timeline"][0]["note"] == "Complaint submitted successfully."
    assert len(created["auditHash"]) == 64
    assert created["createdAt"]
    assert created["updatedAt"]


def test_case_creation_keeps_accepting_legacy_category_strings(
    client: TestClient,
) -> None:
    payload = case_payload()
    payload["category"] = "legacy_custom_category"

    response = client.post("/cases", json=payload)

    assert response.status_code == 201
    assert response.json()["category"] == "legacy_custom_category"


def test_list_get_and_unknown_case(client: TestClient) -> None:
    created = create_case(client)

    listed = client.get("/cases")
    fetched = client.get(f"/cases/{created['id']}")
    missing = client.get("/cases/999999")

    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [created["id"]]
    assert fetched.status_code == 200
    assert fetched.json()["complaintText"] == created["complaintText"]
    assert missing.status_code == 404
    assert missing.json() == {"detail": "Case 999999 does not exist."}


def test_case_status_progresses_in_exact_order_without_skipping(
    client: TestClient,
) -> None:
    created = create_case(client)
    statuses: list[str] = []

    for _ in range(3):
        response = client.post(f"/cases/{created['id']}/advance-status")
        assert response.status_code == 200
        statuses.append(response.json()["status"])

    blocked = client.post(f"/cases/{created['id']}/advance-status")

    assert statuses == ["routed", "under_process", "disposed"]
    assert blocked.status_code == 400
    assert "cannot be advanced" in blocked.json()["detail"]


def test_status_endpoint_translates_disposed_without_claiming_resolution(
    client: TestClient,
) -> None:
    disposed = dispose_case(client)

    response = client.get(f"/cases/{disposed['id']}/status")

    assert response.status_code == 200
    assert response.json() == {
        "status": "disposed",
        "statusPlainLanguage": (
            "The department has closed the complaint; this does not necessarily mean "
            "payment or service was received."
        ),
    }


def test_disposed_case_confirmed_no_creates_deterministic_appeal(
    client: TestClient,
) -> None:
    disposed = dispose_case(client)

    response = client.post(
        f"/cases/{disposed['id']}/confirm-resolution",
        json={"citizenConfirmed": "no"},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["caseId"] == disposed["id"]
    assert payload["citizenConfirmed"] == "no"
    assert payload["appealGenerated"] is True
    assert payload["case"]["status"] == "appealed"
    assert payload["case"]["timeline"][-1]["stage"] == "appealed"
    assert len(payload["case"]["auditHash"]) == 64
    assert f"Case #{disposed['id']}" in payload["appealDraft"]
    assert disposed["complaintText"] in payload["appealDraft"]
    assert disposed["routedDepartment"] in payload["appealDraft"]
    assert "closed without the citizen receiving" in payload["appealDraft"]


def test_partial_confirmation_is_explained_without_appeal(client: TestClient) -> None:
    disposed = dispose_case(client)

    response = client.post(
        f"/cases/{disposed['id']}/confirm-resolution",
        json={"citizenConfirmed": "partial"},
    )

    assert response.status_code == 200
    assert response.json()["appealGenerated"] is False
    assert response.json()["case"]["status"] == "disposed"
    assert "Further action may be necessary" in response.json()["explanation"]


def test_confirmation_rejects_not_asked_value(client: TestClient) -> None:
    created = create_case(client)

    response = client.post(
        f"/cases/{created['id']}/confirm-resolution",
        json={"citizenConfirmed": "not_asked"},
    )

    assert response.status_code == 422
