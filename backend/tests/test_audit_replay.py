import pytest
from app.core.database import SessionLocal, engine, Base
from app.models.models import Incident
from app.services.audit_service import AuditService
from app.services.replay_service import ReplayService


@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


def test_audit_hash_chaining_and_verification(db):
    incident = db.query(Incident).first()
    assert incident is not None, "Incident required for test"

    # Record test event 1
    log1 = AuditService.record_event(
        db=db,
        incident_id=incident.id,
        actor_type="TEST_ACTOR",
        actor_id="TestAgent1",
        action_type="TEST_ACTION_START",
        details={"status": "initialized"}
    )
    assert log1.previous_hash is not None
    assert log1.current_hash is not None

    # Record test event 2
    log2 = AuditService.record_event(
        db=db,
        incident_id=incident.id,
        actor_type="TEST_ACTOR",
        actor_id="TestAgent2",
        action_type="TEST_ACTION_FINISH",
        details={"status": "completed"}
    )
    assert log2.previous_hash == log1.current_hash

    # Verify ledger integrity
    result = AuditService.verify_ledger_integrity(db, incident.id)
    assert result.is_valid is True
    assert result.total_entries >= 2


def test_explainability_report_generation(db):
    incident = db.query(Incident).first()

    report = AuditService.get_explainability_report(db, incident.id)
    assert report.incident_id == incident.id
    assert report.hypothesis is not None
    assert report.confidence_score >= 0.0


def test_replay_timeline_generation(db):
    incident = db.query(Incident).first()

    replay = ReplayService.generate_incident_replay(db, incident.id)
    assert replay.incident_id == incident.id
    assert replay.total_steps >= 1
    assert len(replay.steps) == replay.total_steps
