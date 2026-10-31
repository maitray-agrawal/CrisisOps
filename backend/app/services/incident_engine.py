from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import Incident, Evidence, ActionRecommendation, Machine, MaintenanceRecord, SOPDocument
from app.services.detector import DetectionSummary


class IncidentEngine:
    """Automated backend incident generation and evidence correlation engine."""

    @classmethod
    def process_machine_anomaly(
        cls,
        db: Session,
        machine: Machine,
        detection_summary: DetectionSummary
    ) -> Optional[Incident]:
        """Automatically create or update incident when an anomaly threshold is breached."""
        if not detection_summary.is_anomaly or machine.status in ("NORMAL", "CONTAINED"):
            return None

        # 1. Check for existing non-resolved active incident to avoid duplication
        active_incident = (
            db.query(Incident)
            .filter(
                Incident.machine_id == machine.id,
                Incident.status.in_(["OPEN", "INVESTIGATING", "PENDING_APPROVAL"])
            )
            .first()
        )

        now = datetime.now(timezone.utc)

        if not active_incident:
            incident_id = f"INC-{machine.id.replace('-', '')}-{int(now.timestamp()) % 10000:04d}"
            title = f"{machine.name} — {detection_summary.highest_severity} Anomaly Detected"

            new_incident = Incident(
                id=incident_id,
                machine_id=machine.id,
                title=title,
                severity=detection_summary.highest_severity if detection_summary.highest_severity in ["HIGH", "CRITICAL"] else "MEDIUM",
                status="PENDING_APPROVAL",
                summary=detection_summary.explanation,
                created_at=now
            )
            db.add(new_incident)
            db.commit()
            db.refresh(new_incident)
            active_incident = new_incident

            # 2. Attach Evidence items
            for idx, anomaly in enumerate(detection_summary.anomalies, start=1):
                evidence_item = Evidence(
                    id=f"EVI-{active_incident.id}-{idx}",
                    incident_id=active_incident.id,
                    title=f"Telemetry Anomaly: {anomaly.signal_name}",
                    description=anomaly.explanation,
                    source_type="TELEMETRY_CORRELATION",
                    confidence_score=94.5 if anomaly.severity == "CRITICAL" else 87.0,
                    created_at=now
                )
                db.add(evidence_item)

            # Check maintenance history correlation
            maint_log = (
                db.query(MaintenanceRecord)
                .filter(MaintenanceRecord.machine_id == machine.id)
                .order_by(MaintenanceRecord.timestamp.desc())
                .first()
            )
            if maint_log:
                maint_evidence = Evidence(
                    id=f"EVI-{active_incident.id}-MNT",
                    incident_id=active_incident.id,
                    title=f"Maintenance Lifespan Correlation ({maint_log.component})",
                    description=f"Last service '{maint_log.action_taken}' recorded on {maint_log.timestamp.strftime('%Y-%m-%d')}. Notes: {maint_log.notes}",
                    source_type="MAINTENANCE_LOG",
                    confidence_score=91.0,
                    created_at=now
                )
                db.add(maint_evidence)

            # 3. Attach matching SOP Action Recommendation
            sop = db.query(SOPDocument).filter(SOPDocument.id == f"SOP-{machine.id.replace('-', '')}-BEARING").first()
            if not sop:
                sop = db.query(SOPDocument).first()

            action_rec = ActionRecommendation(
                id=f"ACT-{active_incident.id}-01",
                incident_id=active_incident.id,
                sop_id=sop.id if sop else None,
                action_title=f"Disengage Heavy Load & Execute Emergency SOP ({sop.sop_code if sop else 'SOP-PRIMARY'})",
                description=f"Automated Recommendation: Reduce {machine.id} load to 20%, inspect bearing assembly, and execute lubricant flush.",
                priority=active_incident.severity,
                human_approved=False
            )
            db.add(action_rec)
            db.commit()

        else:
            # Escalation check if severity increases
            if detection_summary.highest_severity == "CRITICAL" and active_incident.severity != "CRITICAL":
                active_incident.severity = "CRITICAL"
                active_incident.summary = f"[ESCALATED] {detection_summary.explanation}"
                db.commit()

        return active_incident
