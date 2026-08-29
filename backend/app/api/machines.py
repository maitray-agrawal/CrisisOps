from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Machine, TelemetryRecord, MaintenanceRecord, Incident
from app.schemas.schemas import (
    MachineResponse,
    MachineDetailResponse,
    TelemetryRecordResponse,
    MaintenanceRecordResponse
)

router = APIRouter(prefix="/machines", tags=["Machines & Telemetry"])


@router.get("", response_model=List[MachineResponse])
def get_machines(db: Session = Depends(get_db)):
    """List all industrial machines."""
    return db.query(Machine).all()


@router.get("/{machine_id}", response_model=MachineDetailResponse)
def get_machine_detail(machine_id: str, db: Session = Depends(get_db)):
    """Get detailed machine information including recent telemetry and maintenance history."""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found")
    
    recent_telemetry = (
        db.query(TelemetryRecord)
        .filter(TelemetryRecord.machine_id == machine_id)
        .order_by(TelemetryRecord.timestamp.desc())
        .limit(50)
        .all()
    )
    
    maintenance_records = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.machine_id == machine_id)
        .order_by(MaintenanceRecord.timestamp.desc())
        .all()
    )
    
    active_incidents = (
        db.query(Incident)
        .filter(Incident.machine_id == machine_id, Incident.status != "RESOLVED")
        .all()
    )
    
    return MachineDetailResponse(
        id=machine.id,
        name=machine.name,
        type=machine.type,
        location=machine.location,
        status=machine.status,
        description=machine.description,
        created_at=machine.created_at,
        recent_telemetry=recent_telemetry,
        maintenance_records=maintenance_records,
        active_incidents=active_incidents
    )


@router.get("/{machine_id}/telemetry", response_model=List[TelemetryRecordResponse])
def get_machine_telemetry(
    machine_id: str,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Fetch time-series telemetry records for a given machine."""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found")
    
    return (
        db.query(TelemetryRecord)
        .filter(TelemetryRecord.machine_id == machine_id)
        .order_by(TelemetryRecord.timestamp.asc())
        .limit(limit)
        .all()
    )


@router.get("/{machine_id}/maintenance", response_model=List[MaintenanceRecordResponse])
def get_machine_maintenance(machine_id: str, db: Session = Depends(get_db)):
    """Fetch historical maintenance records for a given machine."""
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found")
    
    return (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.machine_id == machine_id)
        .order_by(MaintenanceRecord.timestamp.desc())
        .all()
    )
