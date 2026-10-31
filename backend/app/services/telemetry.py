import random
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.models import Machine, TelemetryRecord, Incident
from app.services.detector import AnomalyDetector
from app.services.state_engine import MachineStateEngine
from app.services.incident_engine import IncidentEngine
from app.db.seed import seed_database


class TelemetrySimulator:
    """Industrial telemetry stream generator and scenario simulation engine."""

    # Persistent in-memory scenario state
    _scenario_mode: str = "NORMAL"  # "NORMAL", "DEGRADING", "CRITICAL"
    _step_count: int = 0

    @classmethod
    def get_status(cls):
        return {
            "mode": cls._scenario_mode,
            "step_count": cls._step_count
        }

    @classmethod
    def set_scenario_mode(cls, mode: str):
        cls._scenario_mode = mode
        if mode == "NORMAL":
            cls._step_count = 0

    @classmethod
    def reset_simulation(cls):
        """Reset database to initial seed baseline state."""
        seed_database()
        cls._scenario_mode = "NORMAL"
        cls._step_count = 0
        return {"status": "SUCCESS", "message": "Simulation reset to baseline state."}

    @classmethod
    def trigger_m204_degradation(cls):
        """Trigger M-204 deterministic degradation scenario."""
        cls._scenario_mode = "DEGRADING"
        cls._step_count = 1
        return {"status": "SUCCESS", "message": "M-204 degradation sequence initialized."}

    @classmethod
    def advance_tick(cls, db: Session):
        """Advance telemetry simulation by 1 time tick across all monitored machines."""
        cls._step_count += 1
        now = datetime.now(timezone.utc)
        machines = db.query(Machine).all()

        results = []

        for machine in machines:
            if machine.id == "M-204" and cls._scenario_mode == "DEGRADING":
                # Deterministic M-204 degradation progression
                step = cls._step_count
                if step == 1:
                    vib = 2.8
                    temp = 68.0
                    output = 92.0
                elif step == 2:
                    vib = 3.6
                    temp = 74.0
                    output = 82.0
                elif step == 3:
                    vib = 4.8
                    temp = 79.0
                    output = 69.0
                elif step == 4:
                    vib = 6.4
                    temp = 84.0
                    output = 64.0
                else:
                    vib = 7.82
                    temp = 88.4
                    output = 61.5
            else:
                # Baseline natural operating values with small bounded variation
                if machine.id == "M-204":
                    vib = round(1.8 + random.uniform(-0.1, 0.1), 2)
                    temp = round(52.0 + random.uniform(-0.5, 0.5), 1)
                    output = round(99.0 + random.uniform(-0.5, 0.5), 1)
                elif machine.id == "M-101":
                    vib = round(1.2 + random.uniform(-0.08, 0.08), 2)
                    temp = round(44.0 + random.uniform(-0.4, 0.4), 1)
                    output = round(150.0 + random.uniform(-0.5, 0.5), 1)
                else:  # M-305
                    vib = round(0.8 + random.uniform(-0.05, 0.05), 2)
                    temp = round(61.0 + random.uniform(-0.3, 0.3), 1)
                    output = round(500.0 + random.uniform(-1.0, 1.0), 1)

            # Evaluate telemetry for anomaly
            detection = AnomalyDetector.evaluate_telemetry(vib, temp, output)

            # Record telemetry point in database
            t_record = TelemetryRecord(
                machine_id=machine.id,
                timestamp=now,
                vibration_mm_s=vib,
                temp_celsius=temp,
                output_units_min=output,
                is_anomaly=detection.is_anomaly
            )
            db.add(t_record)
            db.commit()

            # Update Machine State
            MachineStateEngine.derive_and_update_state(db, machine, detection)

            # Process Incident Engine
            incident = IncidentEngine.process_machine_anomaly(db, machine, detection)

            results.append({
                "machine_id": machine.id,
                "status": machine.status,
                "is_anomaly": detection.is_anomaly,
                "vibration_mm_s": vib,
                "temp_celsius": temp,
                "output_units_min": output,
                "incident_created": incident.id if incident else None
            })

        return {
            "step": cls._step_count,
            "mode": cls._scenario_mode,
            "timestamp": now.isoformat(),
            "machines": results
        }
