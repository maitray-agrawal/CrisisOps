from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Incident, Evidence, ActionRecommendation
from app.schemas.schemas import (
    IncidentResponse,
    EvidenceResponse,
    ActionRecommendationResponse
)

router = APIRouter(prefix="/incidents", tags=["Incidents & Investigation"])


@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    status: Optional[str] = Query(None, description="Filter by status (e.g. OPEN, CRITICAL, CONTAINED)"),
    severity: Optional[str] = Query(None, description="Filter by severity (e.g. LOW, MEDIUM, HIGH, CRITICAL)"),
    db: Session = Depends(get_db)
):
    """Fetch active or historical incident reports."""
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)
    
    return query.order_by(Incident.created_at.desc()).all()


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_detail(incident_id: str, db: Session = Depends(get_db)):
    """Fetch incident detail including root cause evidence items and response action recommendations."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")
    return incident


@router.get("/{incident_id}/evidence", response_model=List[EvidenceResponse])
def get_incident_evidence(incident_id: str, db: Session = Depends(get_db)):
    """Fetch evidence items correlated with an incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")
    
    return (
        db.query(Evidence)
        .filter(Evidence.incident_id == incident_id)
        .order_by(Evidence.confidence_score.desc())
        .all()
    )


@router.get("/{incident_id}/actions", response_model=List[ActionRecommendationResponse])
def get_incident_actions(incident_id: str, db: Session = Depends(get_db)):
    """Fetch recommended action plan items for an incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")
    
    return (
        db.query(ActionRecommendation)
        .filter(ActionRecommendation.incident_id == incident_id)
        .all()
    )
