from sqlalchemy.orm import Session
from app.models.models import Machine
from app.services.detector import DetectionSummary


class MachineStateEngine:
    """Backend source of truth for Machine State Transitions."""

    VALID_STATES = {"NORMAL", "WARNING", "ANOMALOUS", "CRITICAL", "CONTAINED"}

    @classmethod
    def derive_and_update_state(
        cls,
        db: Session,
        machine: Machine,
        detection_summary: DetectionSummary
    ) -> str:
        """Derive target machine status based on telemetry anomaly results and update machine record."""
        # Preserve CONTAINED state if already contained by human operator unless reset
        if machine.status == "CONTAINED":
            return "CONTAINED"

        if not detection_summary.is_anomaly:
            target_status = "NORMAL"
        else:
            target_status = detection_summary.highest_severity

        if machine.status != target_status:
            machine.status = target_status
            db.commit()

        return target_status
