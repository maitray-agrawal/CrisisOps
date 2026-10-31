import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.models.models import Machine, TelemetryRecord, Incident
from app.services.detector import AnomalyDetector
from app.services.state_engine import MachineStateEngine
from app.services.incident_engine import IncidentEngine
from app.services.telemetry import TelemetrySimulator
from app.db.seed import seed_database

# Set up testing in-memory SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Populate initial machine baseline
    m204 = Machine(id="M-204", name="Main Hydraulic Drive", type="Hydraulic", location="Station 4", status="NORMAL")
    db.add(m204)
    db.commit()
    yield
    Base.metadata.drop_all(bind=engine)


# 1. Normal telemetry -> no anomaly
def test_normal_telemetry_evaluation():
    detection = AnomalyDetector.evaluate_telemetry(vibration_mm_s=1.8, temp_celsius=52.0, output_units_min=99.0)
    assert detection.is_anomaly is False
    assert detection.highest_severity == "NORMAL"
    assert len(detection.anomalies) == 0


# 2. Vibration threshold breach -> anomaly
def test_vibration_threshold_breach():
    detection = AnomalyDetector.evaluate_telemetry(vibration_mm_s=3.2, temp_celsius=52.0, output_units_min=99.0)
    assert detection.is_anomaly is True
    assert any(a.signal_name == "Vibration Amplitude" for a in detection.anomalies)


# 3. Temperature threshold breach -> anomaly
def test_temperature_threshold_breach():
    detection = AnomalyDetector.evaluate_telemetry(vibration_mm_s=1.8, temp_celsius=78.5, output_units_min=99.0)
    assert detection.is_anomaly is True
    assert any(a.signal_name == "Bearing Temperature" for a in detection.anomalies)


# 4. Output degradation -> anomaly
def test_output_degradation_breach():
    detection = AnomalyDetector.evaluate_telemetry(vibration_mm_s=1.8, temp_celsius=52.0, output_units_min=65.0)
    assert detection.is_anomaly is True
    assert any(a.signal_name == "Production Output Rate" for a in detection.anomalies)


# 5. Multiple anomalies -> higher severity
def test_multiple_anomalies_higher_severity():
    detection = AnomalyDetector.evaluate_telemetry(vibration_mm_s=4.8, temp_celsius=82.0, output_units_min=62.0)
    assert detection.is_anomaly is True
    assert detection.highest_severity == "CRITICAL"
    assert len(detection.anomalies) == 3


# 6. M-204 degradation sequence -> CRITICAL state
def test_m204_degradation_sequence():
    db = TestingSessionLocal()
    machine = db.query(Machine).filter(Machine.id == "M-204").first()

    # Step 1: Warning level
    det1 = AnomalyDetector.evaluate_telemetry(vibration_mm_s=3.2, temp_celsius=70.0, output_units_min=90.0)
    st1 = MachineStateEngine.derive_and_update_state(db, machine, det1)
    assert st1 == "WARNING"

    # Step 2: Critical level
    det2 = AnomalyDetector.evaluate_telemetry(vibration_mm_s=7.8, temp_celsius=88.0, output_units_min=62.0)
    st2 = MachineStateEngine.derive_and_update_state(db, machine, det2)
    assert st2 == "CRITICAL"


# 7. Incident creation on threshold breach
def test_incident_creation():
    db = TestingSessionLocal()
    machine = db.query(Machine).filter(Machine.id == "M-204").first()
    detection = AnomalyDetector.evaluate_telemetry(vibration_mm_s=7.8, temp_celsius=88.0, output_units_min=62.0)

    MachineStateEngine.derive_and_update_state(db, machine, detection)
    incident = IncidentEngine.process_machine_anomaly(db, machine, detection)

    assert incident is not None
    assert incident.machine_id == "M-204"
    assert incident.severity == "CRITICAL"


# 8. Duplicate incident prevention
def test_duplicate_incident_prevention():
    db = TestingSessionLocal()
    machine = db.query(Machine).filter(Machine.id == "M-204").first()
    detection = AnomalyDetector.evaluate_telemetry(vibration_mm_s=7.8, temp_celsius=88.0, output_units_min=62.0)

    MachineStateEngine.derive_and_update_state(db, machine, detection)
    inc1 = IncidentEngine.process_machine_anomaly(db, machine, detection)
    inc2 = IncidentEngine.process_machine_anomaly(db, machine, detection)

    assert inc1.id == inc2.id  # Reused same active incident, no duplicate created


# 9. State transitions
def test_state_transitions():
    db = TestingSessionLocal()
    machine = db.query(Machine).filter(Machine.id == "M-204").first()

    # Normal -> Warning
    det1 = AnomalyDetector.evaluate_telemetry(vibration_mm_s=3.0, temp_celsius=52.0, output_units_min=99.0)
    s1 = MachineStateEngine.derive_and_update_state(db, machine, det1)
    assert s1 == "WARNING"

    # Warning -> Normal
    det2 = AnomalyDetector.evaluate_telemetry(vibration_mm_s=1.8, temp_celsius=52.0, output_units_min=99.0)
    s2 = MachineStateEngine.derive_and_update_state(db, machine, det2)
    assert s2 == "NORMAL"


# 10. Existing API compatibility
def test_existing_api_compatibility():
    # Health endpoint
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

    # Simulation endpoints
    res_status = client.get("/api/simulation/status")
    assert res_status.status_code == 200

    res_tick = client.post("/api/simulation/tick")
    assert res_tick.status_code == 200
    assert "step" in res_tick.json()
