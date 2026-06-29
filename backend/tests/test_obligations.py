import pytest


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


def test_history_records_transition(client):
    oid = client.post("api/obligations", json=_payload()).json()["id"]
    client.patch(f"api/obligations/{oid}/status", json={"status": "in_progress"})

    history = client.get(f"api/obligations/{oid}").json()["status_history"]
    assert len(history) == 1
    assert history[0]["from_status"] == "pending"
    assert history[0]["to_status"] == "in_progress"
    assert history[0]["changed_at"]


def test_history_full_lifecycle_ordered(client):
    oid = client.post("api/obligations", json=_payload()).json()["id"]
    for state in ["in_progress", "submitted", "done"]:
        client.patch(f"api/obligations/{oid}/status", json={"status": state})

    history = client.get(f"api/obligations/{oid}").json()["status_history"]
    assert [(h["from_status"], h["to_status"]) for h in history] == [
        ("pending", "in_progress"),
        ("in_progress", "submitted"),
        ("submitted", "done"),
    ]


def test_history_absent_on_list(client):
    client.post("api/obligations", json=_payload())
    rows = client.get("api/obligations").json()
    assert all("status_history" not in row for row in rows)


def test_history_not_written_on_invalid_transition(client):
    oid = client.post("api/obligations", json=_payload()).json()["id"]
    client.patch(f"api/obligations/{oid}/status", json={"status": "done"})  # 409

    history = client.get(f"api/obligations/{oid}").json()["status_history"]
    assert history == []


def test_version_starts_at_one_and_increments(client):
    body = client.post("api/obligations", json=_payload()).json()
    assert body["version"] == 1

    resp = client.patch(f"api/obligations/{body['id']}/status", json={"status": "in_progress"})
    assert resp.json()["version"] == 2


def test_status_with_matching_expected_version(client):
    oid = client.post("api/obligations", json=_payload()).json()["id"]

    resp = client.patch(
        f"api/obligations/{oid}/status",
        json={"status": "in_progress", "expected_version": 1},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"


def test_status_stale_expected_version_conflicts(client):
    oid = client.post("api/obligations", json=_payload()).json()["id"]
    # bump to version 2
    client.patch(f"api/obligations/{oid}/status", json={"status": "in_progress"})

    # caller still thinks it's version 1
    resp = client.patch(
        f"api/obligations/{oid}/status",
        json={"status": "submitted", "expected_version": 1},
    )
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "CONCURRENT_MODIFICATION"


def test_stale_expected_version_writes_no_history(client):
    oid = client.post("api/obligations", json=_payload()).json()["id"]
    client.patch(f"api/obligations/{oid}/status", json={"status": "in_progress"})

    client.patch(
        f"api/obligations/{oid}/status",
        json={"status": "submitted", "expected_version": 1},
    )  # 409, rejected

    history = client.get(f"api/obligations/{oid}").json()["status_history"]
    # only the one successful transition recorded
    assert [(h["from_status"], h["to_status"]) for h in history] == [
        ("pending", "in_progress"),
    ]


def test_version_id_col_blocks_concurrent_commit():
    # Proves the DB backstop: two sessions load the same row, the second
    # commit fails with StaleDataError once the first bumped the version.
    # TestClient can't overlap requests on the shared connection, so assert
    # at the ORM layer directly.
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.orm.exc import StaleDataError
    from sqlalchemy.pool import StaticPool

    from app.core.database import Base
    from app.models import Obligation, ObligationStatus

    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)

    seed = Session()
    seed.add(
        Obligation(type="annual_report", title="x", owner="a", company_tax_id="12-3456789")
    )
    seed.commit()
    oid = seed.query(Obligation).one().id
    seed.close()

    s1, s2 = Session(), Session()
    o1 = s1.get(Obligation, oid)
    o2 = s2.get(Obligation, oid)

    o1.status = ObligationStatus.in_progress
    s1.commit()  # version 1 -> 2

    o2.status = ObligationStatus.in_progress
    with pytest.raises(StaleDataError):
        s2.commit()  # still expects version 1 -> 0 rows matched

    s1.close()
    s2.close()
