from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Machine(Base):
    __tablename__ = "machines"

    id = Column(String, primary_key=True, index=True)  # e.g. "M-204"
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    location = Column(String, nullable=False)
    status = Column(String, nullable=False, default="NORMAL")  # NORMAL, WARNING, CRITICAL, CONTAINED
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    telemetry_records = relationship("TelemetryRecord", back_populates="machine", cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRecord", back_populates="machine", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="machine", cascade="all, delete-orphan")


class TelemetryRecord(Base):
    __tablename__ = "telemetry_records"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    machine_id = Column(String, ForeignKey("machines.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True, default=lambda: datetime.now(timezone.utc))
    vibration_mm_s = Column(Float, nullable=False)
    temp_celsius = Column(Float, nullable=False)
    output_units_min = Column(Float, nullable=False)
    is_anomaly = Column(Boolean, default=False, nullable=False)

    # Relationships
    machine = relationship("Machine", back_populates="telemetry_records")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(String, primary_key=True, index=True)  # e.g. "MNT-882"
    machine_id = Column(String, ForeignKey("machines.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False)
    component = Column(String, nullable=False)
    action_taken = Column(String, nullable=False)
    technician = Column(String, nullable=False)
    notes = Column(Text, nullable=False)

    # Relationships
    machine = relationship("Machine", back_populates="maintenance_records")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, index=True)  # e.g. "INC-M204-001"
    machine_id = Column(String, ForeignKey("machines.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    severity = Column(String, nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String, nullable=False, default="OPEN")  # OPEN, INVESTIGATING, PENDING_APPROVAL, CONTAINED
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    machine = relationship("Machine", back_populates="incidents")
    evidence_items = relationship("Evidence", back_populates="incident", cascade="all, delete-orphan")
    action_recommendations = relationship("ActionRecommendation", back_populates="incident", cascade="all, delete-orphan")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String, primary_key=True, index=True)  # e.g. "EVI-M204-01"
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    source_type = Column(String, nullable=False)  # TELEMETRY_CORRELATION, MAINTENANCE_LOG, OPERATIONAL_HISTORY
    confidence_score = Column(Float, nullable=False, default=90.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    incident = relationship("Incident", back_populates="evidence_items")


class SOPDocument(Base):
    __tablename__ = "sop_documents"

    id = Column(String, primary_key=True, index=True)  # e.g. "SOP-M204-BEARING"
    sop_code = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    target_component = Column(String, nullable=False)
    content_markdown = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    action_recommendations = relationship("ActionRecommendation", back_populates="sop_document")


class ActionRecommendation(Base):
    __tablename__ = "action_recommendations"

    id = Column(String, primary_key=True, index=True)  # e.g. "ACT-M204-01"
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False, index=True)
    sop_id = Column(String, ForeignKey("sop_documents.id"), nullable=True, index=True)
    action_title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String, nullable=False, default="HIGH")
    human_approved = Column(Boolean, default=False, nullable=False)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    simulation_executed = Column(Boolean, default=False, nullable=False)
    executed_at = Column(DateTime, nullable=True)

    # Relationships
    incident = relationship("Incident", back_populates="action_recommendations")
    sop_document = relationship("SOPDocument", back_populates="action_recommendations")
