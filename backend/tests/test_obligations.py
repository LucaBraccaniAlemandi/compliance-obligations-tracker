def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def _payload(**over):
    base = {
        "type": "annual_report",
        "title": "GDPR review",
        "owner": "alice",
        "company_tax_id": "12-3456789"
    }
    base.update(over)
    return base


def test_create_and_list(client):
    resp = client.post("api/obligations", json=_payload())
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "GDPR review"
    assert body["status"] == "pending"
    # sensitive value masked, never returned raw
    assert body["company_tax_id"] == "****6789"

    resp = client.get("api/obligations")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_create_requires_owner(client):
    resp = client.post("api/obligations", json=_payload(owner=None))
    assert resp.status_code == 422


def test_get_not_found(client):
    resp = client.get("api/obligations/999")
    assert resp.status_code == 404


def test_update_obligation(client):
    oid = client.post("api/obligations", json=_payload()).json()["id"]

    resp = client.patch(f"api/obligations/{oid}", json={"title": "Updated", "owner": "bob"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Updated"
    assert body["owner"] == "bob"
    # untouched fields unchanged
    assert body["type"] == "annual_report"


def test_update_ignores_status_and_tax_id(client):
    oid = client.post("api/obligations", json=_payload()).json()["id"]

    resp = client.patch(
        f"api/obligations/{oid}",
        json={"status": "done", "company_tax_id": "99-9999999"},
    )
    assert resp.status_code == 200
    body = resp.json()
    # both fields not editable — ignored by schema
    assert body["status"] == "pending"
    assert body["company_tax_id"] == "****6789"


def test_update_not_found(client):
    resp = client.patch("api/obligations/999", json={"title": "x"})
    assert resp.status_code == 404


def test_delete_obligation(client):
    oid = client.post("api/obligations", json=_payload()).json()["id"]

    resp = client.delete(f"api/obligations/{oid}")
    assert resp.status_code == 204

    resp = client.get(f"api/obligations/{oid}")
    assert resp.status_code == 404


def test_delete_not_found(client):
    resp = client.delete("api/obligations/999")
    assert resp.status_code == 404


def test_status_valid_transition(client):
    oid = client.post("api/obligations", json=_payload()).json()["id"]

    resp = client.patch(f"api/obligations/{oid}/status", json={"status": "in_progress"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"


def test_status_full_lifecycle(client):
    oid = client.post("api/obligations", json=_payload()).json()["id"]
    for state in ["in_progress", "submitted", "done"]:
        resp = client.patch(f"api/obligations/{oid}/status", json={"status": state})
        assert resp.status_code == 200
        assert resp.json()["status"] == state


def test_status_invalid_transition(client):
    oid = client.post("api/obligations", json=_payload()).json()["id"]

    # pending -> done not allowed
    resp = client.patch(f"api/obligations/{oid}/status", json={"status": "done"})
    assert resp.status_code == 409


def test_status_not_found(client):
    resp = client.patch("api/obligations/999/status", json={"status": "in_progress"})
    assert resp.status_code == 404


def test_submit_blocked_without_document(client):
    oid = client.post(
        "api/obligations", json=_payload(requires_document=True)
    ).json()["id"]
    client.patch(f"api/obligations/{oid}/status", json={"status": "in_progress"})

    resp = client.patch(f"api/obligations/{oid}/status", json={"status": "submitted"})
    assert resp.status_code == 409


def test_submit_allowed_with_document(client):
    oid = client.post(
        "api/obligations",
        json=_payload(requires_document=True, document_path="/docs/file.pdf"),
    ).json()["id"]
    client.patch(f"api/obligations/{oid}/status", json={"status": "in_progress"})

    resp = client.patch(f"api/obligations/{oid}/status", json={"status": "submitted"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "submitted"
