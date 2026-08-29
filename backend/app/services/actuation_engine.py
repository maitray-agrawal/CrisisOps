from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Incident, Machine, ActionRecommendation
from app.services.telemetry import TelemetrySimulator
from app.services.audit_service import AuditService


class ActuationEngine:
    """
    Human Approval Gate & Simulated Actuation Execution Engine
    Enforces human operator authorization before software containment signals execute.
    """

    def approve_action_plan(
        self,
        db: Session,
        incident_id: str,
        operator_name: str = "Lead Industrial Operator"
    ) -> Dict[str, Any]:
        """
        Registers human operator approval on incident response plan.
        """
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise ValueError(f"Incident #{incident_id} not found.")

        recommendations = db.query(ActionRecommendation).filter(ActionRecommendation.incident_id == incident_id).all()
        if not recommendations:
            # Create action recommendation if missing
            rec = ActionRecommendation(
                id=f"ACT-{incident_id}-01",
                incident_id=incident_id,
                sop_id="SOP-M204-BEARING",
                action_title="Emergency Thermal Isolation & Controlled Bearing Lubrication Flush",
                description="Controlled software containment protocol to disengage motor, flush bearing assembly, and eliminate thermal destruction risk.",
                priority="CRITICAL",
                human_approved=True,
                approved_by=operator_name,
                approved_at=datetime.now(timezone.utc)
            )
            db.add(rec)
        else:
            for rec in recommendations:
                rec.human_approved = True
                rec.approved_by = operator_name
                rec.approved_at = datetime.now(timezone.utc)

        incident.status = "APPROVED"
        db.commit()

        AuditService.record_event(
            db=db,
            incident_id=incident_id,
            actor_type="HUMAN_OPERATOR",
            actor_id=operator_name,
            action_type="OPERATOR_APPROVED",
            details={
                "approved_by": operator_name,
                "status": "APPROVED",
                "approved_at": datetime.now(timezone.utc).isoformat()
            }
        )

        return {
            "incident_id": incident_id,
            "status": "APPROVED",
            "human_approved": True,
            "approved_by": operator_name,
            "approved_at": datetime.now(timezone.utc).isoformat()
        }

    def execute_simulated_actuation(
        self,
        db: Session,
        incident_id: str
    ) -> Dict[str, Any]:
        """
        Executes simulated containment actuation, stabilizing machine telemetry and resolving incident ticket.
        """
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise ValueError(f"Incident #{incident_id} not found.")

        # Ensure human approval gate has been passed:
        # Invariant: NO_RECOMMENDATION -> DENY, UNAPPROVED_RECOMMENDATION -> DENY, APPROVED_RECOMMENDATION -> ALLOW
        recommendations = db.query(ActionRecommendation).filter(ActionRecommendation.incident_id == incident_id).all()
        is_approved = bool(recommendations) and any(r.human_approved for r in recommendations)

        if not is_approved:
            raise PermissionError("Human approval required before executing containment actuation.")

        # Update machine state to CONTAINED
        machine = db.query(Machine).filter(Machine.id == incident.machine_id).first()
        if machine:
            machine.status = "CONTAINED"

        # Stabilize telemetry stream back to healthy baseline
        TelemetrySimulator.set_scenario_mode("NORMAL")

        # Mark incident resolved / contained
        incident.status = "CONTAINED"
        incident.resolved_at = datetime.now(timezone.utc)

        for rec in recommendations:
            rec.simulation_executed = True
            rec.executed_at = datetime.now(timezone.utc)

        db.commit()

        AuditService.record_event(
            db=db,
            incident_id=incident_id,
            actor_type="ACTUATION_ENGINE",
            actor_id="SimulatedActuationController",
            action_type="ACTUATION_EXECUTED",
            details={
                "incident_id": incident_id,
                "machine_id": incident.machine_id,
                "machine_status": "CONTAINED",
                "telemetry_stabilized": True
            }
        )

        return {
            "incident_id": incident_id,
            "machine_id": incident.machine_id,
            "machine_status": "CONTAINED",
            "incident_status": "CONTAINED",
            "telemetry_stabilized": True,
            "executed_at": datetime.now(timezone.utc).isoformat()
        }


actuation_engine = ActuationEngine()
