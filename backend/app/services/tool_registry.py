"""
Centralized Tool Registry for CrisisOps Agent Runtime.
Exposes observation, investigation, action, and verification tools
with input/output schemas, risk levels, and real execution handlers.
"""

from typing import Dict, Any, List, Optional, Callable
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.models.models import Machine, TelemetryRecord, MaintenanceRecord, Incident, SOPDocument
from app.agents.signal_agent import SignalCorrelatorAgent
from app.agents.rca_agent import RootCauseAnalysisAgent
from app.agents.impact_agent import ImpactAssessmentAgent
from app.agents.sop_agent import SOPResponseAgent
from app.services.sop_rag_service import sop_rag_service


class ToolDefinition(BaseModel):
    name: str
    category: str  # "OBSERVATION", "INVESTIGATION", "ACTION", "VERIFICATION"
    description: str
    risk_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    requires_approval: bool = False


class ToolRegistry:
    """Registry maintaining metadata and execution bindings for all agent capabilities."""

    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}
        self._handlers: Dict[str, Callable] = {}
        self._register_default_tools()

    def register_tool(
        self,
        name: str,
        category: str,
        description: str,
        risk_level: str,
        handler: Callable,
        requires_approval: bool = False
    ):
        tool_def = ToolDefinition(
            name=name,
            category=category,
            description=description,
            risk_level=risk_level,
            requires_approval=requires_approval
        )
        self._tools[name] = tool_def
        self._handlers[name] = handler

    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        return self._tools.get(name)

    def list_tools(self) -> List[ToolDefinition]:
        return list(self._tools.values())

    def execute_tool(self, name: str, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        handler = self._handlers.get(name)
        if not handler:
            raise ValueError(f"Tool '{name}' not found in registry.")
        return handler(db, context)

    def _register_default_tools(self):
        # 1. Observation: get_machine_state
        self.register_tool(
            name="get_machine_state",
            category="OBSERVATION",
            description="Inspects real-time operating state, asset classification, and location for the target machine.",
            risk_level="LOW",
            handler=self._handle_get_machine_state
        )

        # 2. Observation: get_recent_telemetry
        self.register_tool(
            name="get_recent_telemetry",
            category="OBSERVATION",
            description="Ingests the most recent high-frequency telemetry samples (vibration, temperature, output rate).",
            risk_level="LOW",
            handler=self._handle_get_recent_telemetry
        )

        # 3. Observation: get_maintenance_history
        self.register_tool(
            name="get_maintenance_history",
            category="OBSERVATION",
            description="Fetches recent maintenance logs, overhaul records, and technician work orders for the asset.",
            risk_level="LOW",
            handler=self._handle_get_maintenance_history
        )

        # 4. Investigation: correlate_signals
        self.register_tool(
            name="correlate_signals",
            category="INVESTIGATION",
            description="Applies statistical Z-Score and EWMA anomaly analysis across ingested sensor channels.",
            risk_level="LOW",
            handler=self._handle_correlate_signals
        )

        # 5. Investigation: analyze_root_cause
        self.register_tool(
            name="analyze_root_cause",
            category="INVESTIGATION",
            description="Synthesizes telemetry anomaly patterns with historical work orders to derive physical fault hypothesis.",
            risk_level="LOW",
            handler=self._handle_analyze_root_cause
        )

        # 6. Investigation: calculate_business_impact
        self.register_tool(
            name="calculate_business_impact",
            category="INVESTIGATION",
            description="Evaluates operational downtime hours, capacity reduction percentage, and financial loss ($1,875/hr).",
            risk_level="LOW",
            handler=self._handle_calculate_business_impact
        )

        # 7. Investigation: retrieve_relevant_sop
        self.register_tool(
            name="retrieve_relevant_sop",
            category="INVESTIGATION",
            description="Executes semantic vector RAG search against indexed industrial Standard Operating Procedures.",
            risk_level="LOW",
            handler=self._handle_retrieve_relevant_sop
        )

        # 8. Action: attempt_primary_containment (The Failure Scenario Probe)
        self.register_tool(
            name="attempt_primary_containment",
            category="ACTION",
            description="Attempts standard direct high-speed bearing flush. Subject to physical precondition checks.",
            risk_level="HIGH",
            requires_approval=True,
            handler=self._handle_attempt_primary_containment
        )

        # 9. Action: formulate_adapted_plan
        self.register_tool(
            name="formulate_adapted_plan",
            category="ACTION",
            description="Synthesizes policy-approved adapted containment plan bypassing physical locks with auxiliary valve override.",
            risk_level="MEDIUM",
            requires_approval=True,
            handler=self._handle_formulate_adapted_plan
        )

        # 10. Verification: verify_goal_criteria
        self.register_tool(
            name="verify_goal_criteria",
            category="VERIFICATION",
            description="Performs multi-point objective verification of machine state, sensor signals, and ticket resolution.",
            risk_level="LOW",
            handler=self._handle_verify_goal_criteria
        )

    # Handlers
    def _handle_get_machine_state(self, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        machine_id = context.get("machine_id")
        machine = db.query(Machine).filter(Machine.id == machine_id).first()
        if not machine:
            return {"error": f"Machine {machine_id} not found."}
        return {
            "machine_id": machine.id,
            "name": machine.name,
            "type": machine.type,
            "status": machine.status,
            "location": machine.location
        }

    def _handle_get_recent_telemetry(self, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        machine_id = context.get("machine_id")
        records = (
            db.query(TelemetryRecord)
            .filter(TelemetryRecord.machine_id == machine_id)
            .order_by(TelemetryRecord.timestamp.desc())
            .limit(10)
            .all()
        )
        if not records:
            return {"count": 0, "records": [], "max_vibration": 1.8, "max_temp": 52.0}

        vib_values = [r.vibration_mm_s for r in records]
        temp_values = [r.temp_celsius for r in records]
        return {
            "count": len(records),
            "max_vibration": max(vib_values),
            "avg_vibration": round(sum(vib_values) / len(vib_values), 2),
            "max_temp": max(temp_values),
            "avg_temp": round(sum(temp_values) / len(temp_values), 1),
            "records": [
                {
                    "vibration_mm_s": r.vibration_mm_s,
                    "temp_celsius": r.temp_celsius,
                    "output_units_min": r.output_units_min,
                    "is_anomaly": r.is_anomaly
                }
                for r in records
            ]
        }

    def _handle_get_maintenance_history(self, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        machine_id = context.get("machine_id")
        records = (
            db.query(MaintenanceRecord)
            .filter(MaintenanceRecord.machine_id == machine_id)
            .order_by(MaintenanceRecord.timestamp.desc())
            .all()
        )
        return {
            "count": len(records),
            "records": [
                {
                    "id": m.id,
                    "component": m.component,
                    "action_taken": m.action_taken,
                    "technician": m.technician,
                    "notes": m.notes,
                    "timestamp": m.timestamp.isoformat() if hasattr(m.timestamp, "isoformat") else str(m.timestamp)
                }
                for m in records
            ]
        }

    def _handle_correlate_signals(self, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        machine_id = context.get("machine_id")
        telemetry_raw = context.get("telemetry_data", {}).get("records", [])
        agent = SignalCorrelatorAgent()
        output = agent.analyze_signals(machine_id=machine_id, telemetry_records=telemetry_raw)
        return output.model_dump()

    def _handle_analyze_root_cause(self, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        machine_id = context.get("machine_id")
        signal_data = context.get("signal_analysis")
        maint_records = context.get("maintenance_data", {}).get("records", [])
        agent = RootCauseAnalysisAgent()
        output = agent.analyze_root_cause(
            machine_id=machine_id,
            signal_analysis=signal_data,
            maintenance_records=maint_records
        )
        return output.model_dump()

    def _handle_calculate_business_impact(self, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        machine_id = context.get("machine_id")
        rca_payload = context.get("root_cause_analysis")
        agent = ImpactAssessmentAgent()
        output = agent.assess_impact(machine_id=machine_id, rca_payload=rca_payload)
        return output.model_dump()

    def _handle_retrieve_relevant_sop(self, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        query = context.get("query") or context.get("root_cause_analysis", {}).get("hypothesis", "bearing degradation")
        machine_type = context.get("machine_type", "Centrifugal Compressor")
        rag_results = sop_rag_service.search_sops(db=db, query=query, target_component=machine_type)
        matching_sop = rag_results[0] if rag_results else None
        return {
            "matched_sop": matching_sop,
            "total_candidates": len(rag_results)
        }

    def _handle_attempt_primary_containment(self, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulated failure probe: Evaluates physical plant preconditions before executing high-speed flush.
        Precondition failure: Auxiliary coolant bypass valve #2 is locked closed in current physical state.
        """
        machine_id = context.get("machine_id", "M-204")
        # Real physical condition simulation:
        valve_state = context.get("auxiliary_valve_2_state", "LOCKED_CLOSED")

        if valve_state == "LOCKED_CLOSED":
            return {
                "success": False,
                "action": "Direct High-Speed Auxiliary Bearing Flush",
                "failure_code": "PRECONDITION_VIOLATION",
                "error_message": (
                    f"Physical Precondition Failed on {machine_id}: Auxiliary coolant loop bypass valve #2 is physically "
                    "locked in CLOSED position. Direct high-speed flush rejected to prevent catastrophic hydraulic backpressure surge."
                ),
                "unlocked_override_required": True,
                "failed_precondition": "auxiliary_valve_2_open == True"
            }

        return {
            "success": True,
            "action": "Direct High-Speed Auxiliary Bearing Flush",
            "message": "Physical preconditions satisfied. Containment flush signal generated."
        }

    def _handle_formulate_adapted_plan(self, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        machine_id = context.get("machine_id", "M-204")
        rca = context.get("root_cause_analysis")
        impact = context.get("impact_assessment")
        sop_data = context.get("sop_data", {}).get("matched_sop")

        agent = SOPResponseAgent()
        output = agent.recommend_actions(
            machine_id=machine_id,
            rca_payload=rca,
            impact_output=impact,
            matching_sop=sop_data
        )
        plan = output.model_dump()
        # Adapt plan specifically to address the failed bypass valve precondition:
        plan["action_title"] = "Emergency Thermal Isolation & Controlled Auxiliary Valve Override Flush"
        plan["action_summary"] = (
            "Overcomes auxiliary valve #2 lock by routing coolant through secondary thermal isolation loop "
            "and initiating controlled lubrication flush at regulated 2.1 bar pressure."
        )
        plan["adapted_from_failure"] = True
        return plan

    def _handle_verify_goal_criteria(self, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        machine_id = context.get("machine_id", "M-204")
        incident_id = context.get("incident_id")

        machine = db.query(Machine).filter(Machine.id == machine_id).first()
        incident = db.query(Incident).filter(Incident.id == incident_id).first() if incident_id else None
        latest_t = (
            db.query(TelemetryRecord)
            .filter(TelemetryRecord.machine_id == machine_id)
            .order_by(TelemetryRecord.timestamp.desc())
            .first()
        )

        vib = latest_t.vibration_mm_s if latest_t else 1.8
        temp = latest_t.temp_celsius if latest_t else 52.0
        output = latest_t.output_units_min if latest_t else 95.0

        is_machine_safe = machine.status in ["NORMAL", "CONTAINED"] if machine else False
        is_vib_safe = vib <= 4.5
        is_temp_safe = temp <= 75.0
        is_output_stable = output >= 60.0
        is_incident_contained = incident.status in ["CONTAINED", "RESOLVED"] if incident else False

        all_passed = is_machine_safe and is_vib_safe and is_temp_safe and is_output_stable and is_incident_contained

        return {
            "goal_achieved": all_passed,
            "overall_status": "GOAL ACHIEVED" if all_passed else "GOAL NOT ACHIEVED",
            "criteria": [
                {
                    "metric": "Machine Operating State",
                    "target": "CONTAINED or NORMAL",
                    "current": machine.status if machine else "UNKNOWN",
                    "status": "PASS" if is_machine_safe else "FAIL"
                },
                {
                    "metric": "Vibration Amplitude",
                    "target": "≤ 4.50 mm/s",
                    "current": f"{vib:.2f} mm/s",
                    "status": "PASS" if is_vib_safe else "FAIL"
                },
                {
                    "metric": "Bearing Temperature",
                    "target": "≤ 75.0 °C",
                    "current": f"{temp:.1f} °C",
                    "status": "PASS" if is_temp_safe else "FAIL"
                },
                {
                    "metric": "Production Output Rate",
                    "target": "≥ 60.0 units/min",
                    "current": f"{output:.1f} units/min",
                    "status": "PASS" if is_output_stable else "FAIL"
                },
                {
                    "metric": "Incident Lifecycle State",
                    "target": "CONTAINED or RESOLVED",
                    "current": incident.status if incident else "UNKNOWN",
                    "status": "PASS" if is_incident_contained else "FAIL"
                }
            ]
        }


tool_registry = ToolRegistry()
