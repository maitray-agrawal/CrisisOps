from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import AuditLog, Incident
from app.schemas.schemas import (
    AuditLogResponse,
    AuditVerificationResponse,
    ExplainabilityReport,
    ReplayTimelineResponse
)
from app.services.audit_service import AuditService
from app.services.replay_service import ReplayService

router = APIRouter(prefix="/incidents", tags=["Audit & Replay"])


@router.get("/{incident_id}/audit-trail", response_model=List[AuditLogResponse])
def get_audit_trail(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Incident '{incident_id}' not found.")

    audit_logs = (
        db.query(AuditLog)
        .filter(AuditLog.incident_id == incident_id)
        .order_by(AuditLog.timestamp.asc())
        .all()
    )
    return audit_logs


@router.get("/{incident_id}/audit-trail/verify", response_model=AuditVerificationResponse)
def verify_audit_trail(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Incident '{incident_id}' not found.")

    return AuditService.verify_ledger_integrity(db, incident_id)


@router.get("/{incident_id}/explainability", response_model=ExplainabilityReport)
def get_explainability_report(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Incident '{incident_id}' not found.")

    try:
        return AuditService.get_explainability_report(db, incident_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{incident_id}/replay", response_model=ReplayTimelineResponse)
def get_incident_replay(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Incident '{incident_id}' not found.")

    try:
        return ReplayService.generate_incident_replay(db, incident_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
