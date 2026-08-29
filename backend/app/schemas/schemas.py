from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# Base Config for ORM mode compatibility in Pydantic v2
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Telemetry Record Schemas ---
class TelemetryRecordBase(BaseSchema):
    machine_id: str
    timestamp: datetime
    vibration_mm_s: float
    temp_celsius: float
    output_units_min: float
    is_anomaly: bool = False


class TelemetryRecordCreate(TelemetryRecordBase):
    pass


class TelemetryRecordResponse(TelemetryRecordBase):
    id: int


# --- Maintenance Record Schemas ---
class MaintenanceRecordBase(BaseSchema):
    id: str
    machine_id: str
    timestamp: datetime
    component: str
    action_taken: str
    technician: str
    notes: str


class MaintenanceRecordCreate(MaintenanceRecordBase):
    pass


class MaintenanceRecordResponse(MaintenanceRecordBase):
    pass


# --- Evidence Schemas ---
class EvidenceBase(BaseSchema):
    id: str
    incident_id: str
    title: str
    description: str
    source_type: str
    confidence_score: float = 90.0
    created_at: datetime


class EvidenceCreate(BaseModel):
    title: str
    description: str
    source_type: str
    confidence_score: float = 90.0


class EvidenceResponse(EvidenceBase):
    pass


# --- Action Recommendation Schemas ---
class ActionRecommendationBase(BaseSchema):
    id: str
    incident_id: str
    sop_id: Optional[str] = None
    action_title: str
    description: str
    priority: str = "HIGH"
    human_approved: bool = False
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    simulation_executed: bool = False
    executed_at: Optional[datetime] = None


class ActionRecommendationCreate(BaseModel):
    sop_id: Optional[str] = None
    action_title: str
    description: str
    priority: str = "HIGH"


class ActionRecommendationResponse(ActionRecommendationBase):
    pass


# --- SOP Document Schemas ---
class SOPDocumentBase(BaseSchema):
    id: str
    sop_code: str
    title: str
    target_component: str
    content_markdown: str
    created_at: datetime


class SOPDocumentCreate(BaseModel):
    id: str
    sop_code: str
    title: str
    target_component: str
    content_markdown: str


class SOPDocumentResponse(SOPDocumentBase):
    pass


# --- Incident Schemas ---
class IncidentBase(BaseSchema):
    id: str
    machine_id: str
    title: str
    severity: str = "MEDIUM"
    status: str = "OPEN"
    summary: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None


class IncidentCreate(BaseModel):
    id: str
    machine_id: str
    title: str
    severity: str = "CRITICAL"
    summary: Optional[str] = None


class IncidentResponse(IncidentBase):
    evidence_items: List[EvidenceResponse] = []
    action_recommendations: List[ActionRecommendationResponse] = []


# --- Machine Schemas ---
class MachineBase(BaseSchema):
    id: str
    name: str
    type: str
    location: str
    status: str = "NORMAL"
    description: Optional[str] = None
    created_at: datetime


class MachineCreate(BaseModel):
    id: str
    name: str
    type: str
    location: str
    status: str = "NORMAL"
    description: Optional[str] = None


class MachineResponse(MachineBase):
    pass


class MachineDetailResponse(MachineBase):
    recent_telemetry: List[TelemetryRecordResponse] = []
    maintenance_records: List[MaintenanceRecordResponse] = []
    active_incidents: List[IncidentResponse] = []


# --- Audit, Explainability & Replay Schemas ---
class AuditLogResponse(BaseSchema):
    id: str
    incident_id: str
    timestamp: datetime
    actor_type: str
    actor_id: str
    action_type: str
    details_json: str
    previous_hash: str
    current_hash: str


class AuditVerificationResponse(BaseModel):
    is_valid: bool
    total_entries: int
    tampered_entry_id: Optional[str] = None
    message: str


class ExplainabilityReport(BaseModel):
    incident_id: str
    machine_id: str
    hypothesis: str
    confidence_score: float
    telemetry_features: List[dict] = []
    correlated_maintenance: List[dict] = []
    cited_sop: Optional[dict] = None
    fallback_used: bool = False
    reasoning_summary: str


class ReplayStep(BaseModel):
    step_number: int
    timestamp: datetime
    vibration_mm_s: float
    temp_celsius: float
    output_units_min: float
    machine_status: str
    event_title: Optional[str] = None
    event_type: Optional[str] = None
    event_actor: Optional[str] = None
    details: Optional[dict] = None


class ReplayTimelineResponse(BaseModel):
    incident_id: str
    machine_id: str
    total_steps: int
    steps: List[ReplayStep] = []

