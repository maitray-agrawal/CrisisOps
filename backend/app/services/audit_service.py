import hashlib
import json
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.models import AuditLog, Incident, Evidence, ActionRecommendation, SOPDocument
from app.schemas.schemas import AuditVerificationResponse, ExplainabilityReport


class AuditService:
    @staticmethod
    def _format_timestamp(ts) -> str:
        if isinstance(ts, str):
            try:
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except Exception:
                return ts
        if isinstance(ts, datetime):
            return ts.strftime("%Y-%m-%dT%H:%M:%S.%f")
        return str(ts)

    @classmethod
    def _compute_hash(
        cls,
        log_id: str,
        timestamp: datetime | str,
        actor_type: str,
        actor_id: str,
        action_type: str,
        details_json: str,
        previous_hash: str
    ) -> str:
        timestamp_str = cls._format_timestamp(timestamp)
        payload = f"{log_id}|{timestamp_str}|{actor_type}|{actor_id}|{action_type}|{details_json}|{previous_hash}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @classmethod
    def record_event(
        cls,
        db: Session,
        incident_id: str,
        actor_type: str,
        actor_id: str,
        action_type: str,
        details: dict
    ) -> AuditLog:
        """
        Appends an immutable audit log entry with SHA-256 hash chaining.
        """
        # Get latest log entry for incident to chain hash
        latest_entry = (
            db.query(AuditLog)
            .filter(AuditLog.incident_id == incident_id)
            .order_by(AuditLog.timestamp.desc())
            .first()
        )
        previous_hash = latest_entry.current_hash if latest_entry else "0" * 64

        now = datetime.now(timezone.utc)
        count = db.query(AuditLog).filter(AuditLog.incident_id == incident_id).count()
        log_id = f"AUD-{incident_id}-{count + 1:03d}"
        details_json = json.dumps(details, sort_keys=True)

        current_hash = cls._compute_hash(
            log_id=log_id,
            timestamp=now,
            actor_type=actor_type,
            actor_id=actor_id,
            action_type=action_type,
            details_json=details_json,
            previous_hash=previous_hash
        )

        audit_entry = AuditLog(
            id=log_id,
            incident_id=incident_id,
            timestamp=now,
            actor_type=actor_type,
            actor_id=actor_id,
            action_type=action_type,
            details_json=details_json,
            previous_hash=previous_hash,
            current_hash=current_hash
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry

    @classmethod
    def verify_ledger_integrity(cls, db: Session, incident_id: str) -> AuditVerificationResponse:
        """
        Verifies SHA-256 hash chain continuity and payload authenticity.
        """
        entries = (
            db.query(AuditLog)
            .filter(AuditLog.incident_id == incident_id)
            .order_by(AuditLog.timestamp.asc())
            .all()
        )

        if not entries:
            return AuditVerificationResponse(
                is_valid=True,
                total_entries=0,
                tampered_entry_id=None,
                message="No audit entries recorded for this incident."
            )

        expected_prev = "0" * 64
        for entry in entries:
            if entry.previous_hash != expected_prev:
                return AuditVerificationResponse(
                    is_valid=False,
                    total_entries=len(entries),
                    tampered_entry_id=entry.id,
                    message=f"Hash chain broken at entry {entry.id}. Expected previous hash {expected_prev[:12]}..., got {entry.previous_hash[:12]}..."
                )

            computed = cls._compute_hash(
                log_id=entry.id,
                timestamp=entry.timestamp,
                actor_type=entry.actor_type,
                actor_id=entry.actor_id,
                action_type=entry.action_type,
                details_json=entry.details_json,
                previous_hash=entry.previous_hash
            )

            if computed != entry.current_hash:
                return AuditVerificationResponse(
                    is_valid=False,
                    total_entries=len(entries),
                    tampered_entry_id=entry.id,
                    message=f"Payload tampering detected at entry {entry.id}. Calculated hash {computed[:12]}... differs from stored hash {entry.current_hash[:12]}..."
                )

            expected_prev = entry.current_hash

        return AuditVerificationResponse(
            is_valid=True,
            total_entries=len(entries),
            tampered_entry_id=None,
            message="Cryptographic audit chain verified 100% authentic."
        )

    @classmethod
    def get_explainability_report(cls, db: Session, incident_id: str) -> ExplainabilityReport:
        """
        Synthesizes RAG citations, confidence breakdown, and feature attributions.
        """
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise ValueError(f"Incident {incident_id} not found.")

        evidence_items = db.query(Evidence).filter(Evidence.incident_id == incident_id).all()
        recommendation = db.query(ActionRecommendation).filter(ActionRecommendation.incident_id == incident_id).first()

        telemetry_features = []
        correlated_maint = []
        hypothesis = "Pending analysis"
        confidence_score = 0.0

        for item in evidence_items:
            if item.source_type == "TELEMETRY_CORRELATION":
                telemetry_features.append({
                    "title": item.title,
                    "description": item.description,
                    "confidence": item.confidence_score
                })
            elif item.source_type == "MAINTENANCE_LOG":
                correlated_maint.append({
                    "title": item.title,
                    "description": item.description,
                    "confidence": item.confidence_score
                })
            elif item.source_type == "ROOT_CAUSE_HYPOTHESIS":
                hypothesis = item.description
                confidence_score = item.confidence_score

        sop_info = None
        if recommendation and recommendation.sop_id:
            sop_doc = db.query(SOPDocument).filter(SOPDocument.id == recommendation.sop_id).first()
            if sop_doc:
                sop_info = {
                    "id": sop_doc.id,
                    "code": sop_doc.sop_code,
                    "title": sop_doc.title,
                    "target_component": sop_doc.target_component,
                    "snippet": sop_doc.content_markdown[:250] + "..." if len(sop_doc.content_markdown) > 250 else sop_doc.content_markdown
                }

        summary = (
            f"Incident {incident.id} for machine {incident.machine_id} was identified with root cause: '{hypothesis}' "
            f"({confidence_score}% confidence). "
            f"Correlated with {len(telemetry_features)} telemetry signal anomalies and {len(correlated_maint)} maintenance history records."
        )

        return ExplainabilityReport(
            incident_id=incident.id,
            machine_id=incident.machine_id,
            hypothesis=hypothesis,
            confidence_score=confidence_score,
            telemetry_features=telemetry_features,
            correlated_maintenance=correlated_maint,
            cited_sop=sop_info,
            fallback_used=False,
            reasoning_summary=summary
        )
