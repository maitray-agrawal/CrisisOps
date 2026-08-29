from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Machine, TelemetryRecord
from app.services.telemetry import TelemetrySimulator
from app.services.detector import AnomalyDetector

router = APIRouter(prefix="/simulation", tags=["Simulation & Telemetry Engine"])


@router.get("/status")
def get_simulation_status():
    """Get current telemetry scenario state."""
    return TelemetrySimulator.get_status()


@router.post("/tick")
def step_simulation_tick(db: Session = Depends(get_db)):
    """Advance telemetry stream across all monitored assets by 1 step."""
    return TelemetrySimulator.advance_tick(db)


@router.post("/trigger-degradation")
def trigger_degradation():
    """Trigger deterministic M-204 bearing degradation sequence."""
    return TelemetrySimulator.trigger_m204_degradation()


@router.post("/reset")
def reset_simulation():
    """Reset database and telemetry streams back to normal baseline."""
    return TelemetrySimulator.reset_simulation()


@router.get("/anomalies/{machine_id}")
def analyze_machine_anomalies(machine_id: str, db: Session = Depends(get_db)):
    """Evaluate latest telemetry record for machine and return explainable anomaly report."""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found")

    latest_telemetry = (
        db.query(TelemetryRecord)
        .filter(TelemetryRecord.machine_id == machine_id)
        .order_by(TelemetryRecord.timestamp.desc())
        .first()
    )

    if not latest_telemetry:
        raise HTTPException(status_code=404, detail="No telemetry records found for machine")

    detection = AnomalyDetector.evaluate_telemetry(
        vibration_mm_s=latest_telemetry.vibration_mm_s,
        temp_celsius=latest_telemetry.temp_celsius,
        output_units_min=latest_telemetry.output_units_min
    )

    return {
        "machine_id": machine.id,
        "machine_name": machine.name,
        "machine_status": machine.status,
        "latest_telemetry": {
            "timestamp": latest_telemetry.timestamp.isoformat(),
            "vibration_mm_s": latest_telemetry.vibration_mm_s,
            "temp_celsius": latest_telemetry.temp_celsius,
            "output_units_min": latest_telemetry.output_units_min
        },
        "anomaly_evaluation": detection.model_dump()
    }
