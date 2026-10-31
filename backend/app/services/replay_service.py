import json
from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session

from app.models.models import Incident, TelemetryRecord, AuditLog
from app.schemas.schemas import ReplayTimelineResponse, ReplayStep


class ReplayService:
    @classmethod
    def generate_incident_replay(cls, db: Session, incident_id: str) -> ReplayTimelineResponse:
        """
        Reconstructs step-by-step chronological replay timeline combining telemetry ticks and audit ledger events.
        """
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise ValueError(f"Incident {incident_id} not found.")

        # Retrieve telemetry records around incident creation
        telemetry_records = (
            db.query(TelemetryRecord)
            .filter(TelemetryRecord.machine_id == incident.machine_id)
            .order_by(TelemetryRecord.timestamp.asc())
            .all()
        )

        # Retrieve audit events for incident
        audit_events = (
            db.query(AuditLog)
            .filter(AuditLog.incident_id == incident_id)
            .order_by(AuditLog.timestamp.asc())
            .all()
        )

        # Build combined chronological timeline
        timeline_items = []
        for t in telemetry_records:
            timeline_items.append({
                "time": t.timestamp,
                "type": "TELEMETRY",
                "object": t
            })
        for a in audit_events:
            timeline_items.append({
                "time": a.timestamp,
                "type": "AUDIT_EVENT",
                "object": a
            })

        timeline_items.sort(key=lambda x: x["time"])

        steps: List[ReplayStep] = []
        step_counter = 1

        curr_vibration = 1.8
        curr_temp = 52.0
        curr_output = 95.0
        curr_status = "NORMAL"

        for item in timeline_items:
            if item["type"] == "TELEMETRY":
                t: TelemetryRecord = item["object"]
                curr_vibration = t.vibration_mm_s
                curr_temp = t.temp_celsius
                curr_output = t.output_units_min
                if t.is_anomaly:
                    curr_status = "ANOMALOUS"

                steps.append(ReplayStep(
                    step_number=step_counter,
                    timestamp=t.timestamp,
                    vibration_mm_s=curr_vibration,
                    temp_celsius=curr_temp,
                    output_units_min=curr_output,
                    machine_status=curr_status,
                    event_title="Telemetry Tick Received",
                    event_type="TELEMETRY_SAMPLE",
                    event_actor="TelemetrySensorEngine",
                    details={
                        "is_anomaly": t.is_anomaly,
                        "vibration_status": "CRITICAL" if curr_vibration > 4.5 else "NORMAL"
                    }
                ))
                step_counter += 1

            elif item["type"] == "AUDIT_EVENT":
                a: AuditLog = item["object"]
                details_dict = {}
                try:
                    details_dict = json.loads(a.details_json)
                except Exception:
                    details_dict = {"raw": a.details_json}

                if a.action_type == "ACTUATION_EXECUTED":
                    curr_status = "CONTAINED"
                    curr_vibration = 1.8
                    curr_temp = 52.0

                steps.append(ReplayStep(
                    step_number=step_counter,
                    timestamp=a.timestamp,
                    vibration_mm_s=curr_vibration,
                    temp_celsius=curr_temp,
                    output_units_min=curr_output,
                    machine_status=curr_status,
                    event_title=f"{a.action_type.replace('_', ' ').title()}",
                    event_type=a.action_type,
                    event_actor=f"{a.actor_type} ({a.actor_id})",
                    details=details_dict
                ))
                step_counter += 1

        # Fallback if no steps were generated
        if not steps:
            steps.append(ReplayStep(
                step_number=1,
                timestamp=incident.created_at or datetime.now(timezone.utc),
                vibration_mm_s=7.8,
                temp_celsius=88.5,
                output_units_min=45.0,
                machine_status=incident.status,
                event_title="Incident Triggered",
                event_type="INCIDENT_CREATED",
                event_actor="IncidentEngine",
                details={"title": incident.title, "severity": incident.severity}
            ))

        return ReplayTimelineResponse(
            incident_id=incident.id,
            machine_id=incident.machine_id,
            total_steps=len(steps),
            steps=steps
        )
