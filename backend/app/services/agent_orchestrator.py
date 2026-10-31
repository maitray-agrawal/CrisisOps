import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.models import Incident, Machine, MaintenanceRecord, Evidence, ActionRecommendation, SOPDocument
from app.agents.signal_agent import SignalCorrelatorAgent
from app.agents.rca_agent import RootCauseAnalysisAgent
from app.agents.impact_agent import ImpactAssessmentAgent
from app.agents.sop_agent import SOPResponseAgent
from app.services.sop_rag_service import sop_rag_service
from app.services.audit_service import AuditService

logger = logging.getLogger("crisisops.orchestrator")


class MultiAgentOrchestrator:
    """
    Multi-Agent Pipeline Orchestrator
    Manages sequential execution of Agents 1-4 with deterministic fallbacks and SQLite persistence.
    """

    def __init__(self):
        self.signal_agent = SignalCorrelatorAgent()
        self.rca_agent = RootCauseAnalysisAgent()
        self.impact_agent = ImpactAssessmentAgent()
        self.sop_agent = SOPResponseAgent()

    def run_investigation_pipeline(
        self,
        db: Session,
        incident_id: str
    ) -> Dict[str, Any]:
        """
        Executes complete 4-agent investigation pipeline for a given incident ticket.
        """
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise ValueError(f"Incident #{incident_id} not found.")

        machine = db.query(Machine).filter(Machine.id == incident.machine_id).first()
        if not machine:
            raise ValueError(f"Machine {incident.machine_id} not found.")

        # Fetch recent telemetry records for machine
        telemetry_records = [
            {
                "vibration_mm_s": t.vibration_mm_s,
                "temp_celsius": t.temp_celsius,
                "output_units_min": t.output_units_min,
                "timestamp": t.timestamp
            }
            for t in machine.telemetry_records[:10]
        ]

        # Fetch maintenance records for machine
        maintenance_records = [
            {
                "id": m.id,
                "component": m.component,
                "action_taken": m.action_taken,
                "technician": m.technician,
                "notes": m.notes,
                "timestamp": m.timestamp
            }
            for m in machine.maintenance_records
        ]

        # Stage 1: Signal Correlator Agent
        signal_output = self.signal_agent.analyze_signals(
            machine_id=machine.id,
            telemetry_records=telemetry_records
        )
        AuditService.record_event(
            db=db,
            incident_id=incident_id,
            actor_type="AGENT_SIGNAL",
            actor_id="SignalCorrelatorAgent",
            action_type="SIGNAL_CORRELATED",
            details=signal_output.model_dump()
        )

        # Stage 2: Root Cause Analysis (RCA) Agent
        rca_output = self.rca_agent.analyze_root_cause(
            machine_id=machine.id,
            signal_analysis=signal_output,
            maintenance_records=maintenance_records
        )
        AuditService.record_event(
            db=db,
            incident_id=incident_id,
            actor_type="AGENT_RCA",
            actor_id="RootCauseAnalysisAgent",
            action_type="RCA_GENERATED",
            details=rca_output.model_dump()
        )

        # Stage 3: Impact Assessment Agent
        impact_output = self.impact_agent.assess_impact(
            machine_id=machine.id,
            rca_payload=rca_output
        )
        AuditService.record_event(
            db=db,
            incident_id=incident_id,
            actor_type="AGENT_IMPACT",
            actor_id="ImpactAssessmentAgent",
            action_type="IMPACT_ASSESSED",
            details=impact_output.model_dump()
        )

        # Stage 4: SOP RAG Retrieval & Response Agent
        rag_results = sop_rag_service.search_sops(
            db=db,
            query=rca_output.hypothesis,
            target_component=machine.type
        )
        matching_sop = rag_results[0] if rag_results else None

        sop_output = self.sop_agent.recommend_actions(
            machine_id=machine.id,
            rca_payload=rca_output,
            impact_output=impact_output,
            matching_sop=matching_sop
        )
        AuditService.record_event(
            db=db,
            incident_id=incident_id,
            actor_type="AGENT_SOP",
            actor_id="SOPResponseAgent",
            action_type="SOP_MATCHED",
            details=sop_output.model_dump()
        )

        # Update Incident in Database
        incident.summary = (
            f"RCA Hypothesis ({rca_output.confidence_score:.0f}% Confidence): {rca_output.hypothesis} | "
            f"Impact: ${impact_output.estimated_financial_loss_usd:,.0f} loss, {impact_output.estimated_downtime_hours:.0f}h downtime."
        )
        incident.status = "PENDING_APPROVAL"
        db.commit()

        # Persist Evidence Items if not already present
        existing_evi = db.query(Evidence).filter(Evidence.incident_id == incident_id).all()
        if not existing_evi:
            for idx, evi_item in enumerate(rca_output.evidence_items):
                evi = Evidence(
                    id=f"EVI-{incident_id}-{idx + 1:02d}",
                    incident_id=incident_id,
                    title=f"Telemetry & Maintenance Correlation #{idx + 1}",
                    description=evi_item,
                    source_type="TELEMETRY_CORRELATION" if "vibration" in evi_item.lower() else "MAINTENANCE_LOG",
                    confidence_score=rca_output.confidence_score
                )
                db.add(evi)

        # Persist Action Recommendations if not already present
        existing_act = db.query(ActionRecommendation).filter(ActionRecommendation.incident_id == incident_id).all()
        if not existing_act:
            rec = ActionRecommendation(
                id=f"ACT-{incident_id}-01",
                incident_id=incident_id,
                sop_id=sop_output.sop_id,
                action_title=sop_output.action_title,
                description=sop_output.action_summary,
                priority=sop_output.priority,
                human_approved=False
            )
            db.add(rec)

        db.commit()

        return {
            "incident_id": incident_id,
            "machine_id": machine.id,
            "signal_analysis": signal_output.model_dump(),
            "root_cause_analysis": rca_output.model_dump(),
            "impact_assessment": impact_output.model_dump(),
            "action_plan": sop_output.model_dump(),
            "retrieved_sop": matching_sop,
            "pipeline_status": "COMPLETED",
            "executed_at": datetime.now(timezone.utc).isoformat()
        }


agent_orchestrator = MultiAgentOrchestrator()
