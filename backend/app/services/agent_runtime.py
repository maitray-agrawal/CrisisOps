"""
CrisisOps Agent Runtime & Controller
Implements dynamic tool selection, stateful execution loop, intermediate outcome evaluation,
failure handling, adaptive replanning, and goal verification.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.models.models import Incident, Machine, Evidence, ActionRecommendation
from app.services.tool_registry import tool_registry, ToolDefinition
from app.services.audit_service import AuditService

logger = logging.getLogger("crisisops.agent_runtime")


class IterationTrace(BaseModel):
    iteration: int
    tool_name: str
    tool_category: str
    decision_rationale: str
    observation_summary: str
    result_summary: str
    status: str  # "SUCCESS", "FAILED", "ADAPTED"
    confidence_score: Optional[float] = None
    adaptation_note: Optional[str] = None
    timestamp: str


class AgentState(BaseModel):
    incident_id: str
    machine_id: str
    goal: str
    status: str = "INITIALIZING"  # INITIALIZING, OBSERVING, INVESTIGATING, ADAPTING, ACTION_PROPOSED, VERIFIED
    iteration: int = 0
    max_iterations: int = 8
    observations: Dict[str, Any] = Field(default_factory=dict)
    evidence: List[str] = Field(default_factory=list)
    hypotheses: List[str] = Field(default_factory=list)
    selected_tools: List[str] = Field(default_factory=list)
    completed_tools: List[str] = Field(default_factory=list)
    failed_actions: List[Dict[str, Any]] = Field(default_factory=list)
    adaptation_events: List[Dict[str, Any]] = Field(default_factory=list)
    confidence: float = 0.0
    risk_level: str = "UNKNOWN"
    pending_action: Optional[Dict[str, Any]] = None
    success_criteria: List[Dict[str, Any]] = Field(default_factory=list)
    verification_results: Optional[Dict[str, Any]] = None
    trace: List[IterationTrace] = Field(default_factory=list)


class AgentRuntime:
    """Central Controller managing goal-driven agent loop with dynamic tool selection."""

    def __init__(self):
        self.tool_registry = tool_registry

    def run_investigation(
        self,
        db: Session,
        incident_id: str
    ) -> AgentState:
        """
        Executes the goal-driven autonomous investigation and adaptive decision loop.
        """
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise ValueError(f"Incident #{incident_id} not found.")

        machine = db.query(Machine).filter(Machine.id == incident.machine_id).first()
        if not machine:
            raise ValueError(f"Machine {incident.machine_id} not found.")

        # 1. Initialize Stateful Agent State
        state = AgentState(
            incident_id=incident_id,
            machine_id=machine.id,
            goal=f"Investigate and mitigate {machine.id} degradation, prevent catastrophic line trip, and return asset to verified operating state.",
            status="INVESTIGATING"
        )

        AuditService.record_event(
            db=db,
            incident_id=incident_id,
            actor_type="AGENT_RUNTIME",
            actor_id="AgentController",
            action_type="GOAL_INITIALIZED",
            details={
                "goal": state.goal,
                "machine_id": machine.id,
                "incident_id": incident_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

        context: Dict[str, Any] = {
            "incident_id": incident_id,
            "machine_id": machine.id,
            "machine_type": machine.type
        }

        # 2. Dynamic Execution Loop
        while state.iteration < state.max_iterations and state.status != "ACTION_PROPOSED":
            state.iteration += 1
            tool_name, rationale = self._select_next_tool(state, context)

            if not tool_name:
                logger.info(f"Iteration {state.iteration}: No further tools required.")
                break

            state.selected_tools.append(tool_name)
            tool_def = self.tool_registry.get_tool(tool_name)
            tool_category = tool_def.category if tool_def else "GENERAL"

            AuditService.record_event(
                db=db,
                incident_id=incident_id,
                actor_type="AGENT_RUNTIME",
                actor_id="AgentController",
                action_type="TOOL_SELECTED",
                details={
                    "iteration": state.iteration,
                    "tool": tool_name,
                    "category": tool_category,
                    "rationale": rationale
                }
            )

            # Execute Selected Tool
            try:
                result = self.tool_registry.execute_tool(tool_name, db, context)
            except Exception as e:
                result = {"error": str(e)}

            # Evaluate Outcome & Update State
            self._evaluate_tool_outcome(state, context, tool_name, tool_category, rationale, result, db)

        # 3. Post-Loop Action Persistence & Incident Update
        self._finalize_investigation(db, incident, state, context)

        # 4. Initial Goal Verification Check
        verif_result = self.tool_registry.execute_tool("verify_goal_criteria", db, context)
        state.verification_results = verif_result

        AuditService.record_event(
            db=db,
            incident_id=incident_id,
            actor_type="AGENT_RUNTIME",
            actor_id="AgentController",
            action_type="GOAL_VERIFICATION_EVALUATED",
            details=verif_result
        )

        return state

    def _select_next_tool(self, state: AgentState, context: Dict[str, Any]) -> tuple[Optional[str], str]:
        """
        Dynamic tool selection engine based on current observations, evidence confidence,
        failed actions, and remaining goals.
        """
        # Step 1: Ensure telemetry observation is available
        if "get_recent_telemetry" not in state.completed_tools:
            return "get_recent_telemetry", "Observe real-time sensor registers to verify anomaly signature."

        # Step 2: If telemetry observed, correlate signals
        if "correlate_signals" not in state.completed_tools:
            return "correlate_signals", "Apply Z-score anomaly evaluation across vibration and thermal registers."

        # Step 3: Check maintenance history if not yet ingested
        if "get_maintenance_history" not in state.completed_tools:
            return "get_maintenance_history", "Query historical maintenance logs to detect correlated work orders or recent overhauls."

        # Step 4: Run root cause analysis if signal & maintenance observations are present
        if "analyze_root_cause" not in state.completed_tools:
            return "analyze_root_cause", "Synthesize multi-sensor anomaly patterns with maintenance history for hypothesis formulation."

        # Step 5: Evaluate business and financial exposure
        if "calculate_business_impact" not in state.completed_tools:
            return "calculate_business_impact", "Quantify operational downtime hours and financial exposure ($1,875/hr loss model)."

        # Step 6: Retrieve relevant SOP
        if "retrieve_relevant_sop" not in state.completed_tools:
            return "retrieve_relevant_sop", "Query vector RAG library for engineering containment protocols matching RCA hypothesis."

        # Step 7: Failure Scenario & Adaptive Replanning Loop
        # Attempt standard primary containment first to test physical plant preconditions
        if "attempt_primary_containment" not in state.completed_tools:
            return "attempt_primary_containment", "Evaluate physical plant preconditions for standard high-speed auxiliary flush."

        # Step 8: If primary containment failed, adapt strategy with valve override plan
        if state.failed_actions and "formulate_adapted_plan" not in state.completed_tools:
            return "formulate_adapted_plan", "Adapt strategy: construct policy-approved auxiliary bypass override plan to bypass locked valve."

        return None, "All diagnostic and adaptive containment planning steps completed."

    def _evaluate_tool_outcome(
        self,
        state: AgentState,
        context: Dict[str, Any],
        tool_name: str,
        tool_category: str,
        rationale: str,
        result: Dict[str, Any],
        db: Session
    ):
        """Processes tool execution result, records ledger entries, and updates agent knowledge."""
        state.completed_tools.append(tool_name)
        status = "SUCCESS"
        obs_summary = ""
        res_summary = ""
        adaptation_note = None

        if tool_name == "get_recent_telemetry":
            context["telemetry_data"] = result
            state.observations["telemetry"] = {
                "max_vibration": result.get("max_vibration"),
                "max_temp": result.get("max_temp"),
                "count": result.get("count")
            }
            obs_summary = f"Ingested {result.get('count', 0)} telemetry samples from machine {context.get('machine_id')}."
            res_summary = f"Peak vibration {result.get('max_vibration')} mm/s; peak temp {result.get('max_temp')} °C."

        elif tool_name == "correlate_signals":
            context["signal_analysis"] = result
            state.observations["signal_analysis"] = result
            state.evidence.append(f"Signal Variance: +{result.get('variance_pct', 0):.1f}% in {result.get('primary_anomaly', 'sensors')}")
            obs_summary = "Evaluated sensor variance against baseline normal distribution."
            res_summary = result.get("signal_summary", "Sensor anomaly correlated.")

        elif tool_name == "get_maintenance_history":
            context["maintenance_data"] = result
            state.observations["maintenance_history"] = {"count": result.get("count")}
            obs_summary = f"Retrieved {result.get('count', 0)} historical work orders."
            res_summary = "Maintenance records loaded into agent investigation context."

        elif tool_name == "analyze_root_cause":
            context["root_cause_analysis"] = result
            state.observations["root_cause"] = result
            state.hypotheses.append(result.get("hypothesis", "Mechanical degradation"))
            state.confidence = result.get("confidence_score", 85.0)
            for item in result.get("evidence_items", []):
                if item not in state.evidence:
                    state.evidence.append(item)
            obs_summary = "Correlated sensor spike with historical maintenance journal records."
            res_summary = f"Hypothesis ({state.confidence:.0f}% confidence): {result.get('hypothesis')}"

        elif tool_name == "calculate_business_impact":
            context["impact_assessment"] = result
            state.observations["impact"] = result
            state.risk_level = result.get("safety_risk_rating", "HIGH")
            downtime = result.get("estimated_downtime_hours", 24.0)
            loss = result.get("estimated_financial_loss_usd", 45000.0)
            obs_summary = "Applied refinery loss model ($1,875/hr base rate)."
            res_summary = f"Estimated loss: ${loss:,.0f} USD ({downtime:.0f} hours downtime risk)."

        elif tool_name == "retrieve_relevant_sop":
            context["sop_data"] = result
            state.observations["sop"] = result
            matched = result.get("matched_sop", {})
            sop_code = matched.get("sop_code", "SOP-M204-BEARING") if matched else "SOP-M204-BEARING"
            obs_summary = "Indexed engineering SOP vector database queried."
            res_summary = f"Matched validated procedure: {sop_code}"

        elif tool_name == "attempt_primary_containment":
            # Genuine simulated failure handling
            if not result.get("success", False):
                status = "FAILED"
                state.failed_actions.append({
                    "action": result.get("action"),
                    "reason": result.get("error_message"),
                    "failed_precondition": result.get("failed_precondition"),
                    "iteration": state.iteration
                })
                adaptation_note = "Precondition violation: Auxiliary bypass valve #2 locked closed. Strategy adapted: replanning with auxiliary valve override."
                state.adaptation_events.append({
                    "from_strategy": "Direct High-Speed Auxiliary Bearing Flush",
                    "to_strategy": "Emergency Thermal Isolation & Controlled Auxiliary Valve Override Flush",
                    "reason": result.get("error_message"),
                    "iteration": state.iteration
                })
                obs_summary = "Evaluated physical plant preconditions on auxiliary loop."
                res_summary = result.get("error_message")

                AuditService.record_event(
                    db=db,
                    incident_id=state.incident_id,
                    actor_type="AGENT_RUNTIME",
                    actor_id="AgentController",
                    action_type="ACTION_ATTEMPT_FAILED",
                    details=result
                )

                AuditService.record_event(
                    db=db,
                    incident_id=state.incident_id,
                    actor_type="AGENT_RUNTIME",
                    actor_id="AgentController",
                    action_type="STRATEGY_ADAPTED",
                    details={
                        "iteration": state.iteration,
                        "failed_action": result.get("action"),
                        "adaptation_event": adaptation_note
                    }
                )

        elif tool_name == "formulate_adapted_plan":
            context["action_plan"] = result
            state.pending_action = result
            state.status = "ACTION_PROPOSED"
            obs_summary = "Synthesized alternative containment plan bypassing physical locks."
            res_summary = f"Adapted Plan formulated: {result.get('action_title')}"

        trace_entry = IterationTrace(
            iteration=state.iteration,
            tool_name=tool_name,
            tool_category=tool_category,
            decision_rationale=rationale,
            observation_summary=obs_summary,
            result_summary=res_summary,
            status=status,
            confidence_score=state.confidence if state.confidence > 0 else None,
            adaptation_note=adaptation_note,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        state.trace.append(trace_entry)

    def _finalize_investigation(
        self,
        db: Session,
        incident: Incident,
        state: AgentState,
        context: Dict[str, Any]
    ):
        """Persists evidence, action recommendations, and incident summary to DB."""
        rca = context.get("root_cause_analysis", {})
        impact = context.get("impact_assessment", {})
        action_plan = context.get("action_plan", {})

        hypothesis = rca.get("hypothesis", "Bearing degradation detected.")
        confidence = rca.get("confidence_score", 89.0)
        loss = impact.get("estimated_financial_loss_usd", 45000.0)

        incident.summary = (
            f"RCA Hypothesis ({confidence:.0f}% Confidence): {hypothesis} | "
            f"Risk: ${loss:,.0f} USD financial exposure | Strategy Adapted: Precondition lock resolved via valve override."
        )
        if incident.status not in ["CONTAINED", "RESOLVED"]:
            incident.status = "PENDING_APPROVAL"

        # Persist Evidence Items if missing
        existing_evi = db.query(Evidence).filter(Evidence.incident_id == incident.id).all()
        if not existing_evi:
            for idx, evi_item in enumerate(state.evidence[:5]):
                evi = Evidence(
                    id=f"EVI-{incident.id}-{idx + 1:02d}",
                    incident_id=incident.id,
                    title=f"Telemetry & Maintenance Correlation #{idx + 1}",
                    description=evi_item,
                    source_type="TELEMETRY_CORRELATION" if "variance" in evi_item.lower() or "vibration" in evi_item.lower() else "MAINTENANCE_LOG",
                    confidence_score=confidence
                )
                db.add(evi)

        # Persist Action Recommendation if missing
        existing_act = db.query(ActionRecommendation).filter(ActionRecommendation.incident_id == incident.id).first()
        if not existing_act and action_plan:
            rec = ActionRecommendation(
                id=f"ACT-{incident.id}-01",
                incident_id=incident.id,
                sop_id=action_plan.get("sop_id", "SOP-M204-BEARING"),
                action_title=action_plan.get("action_title", "Emergency Thermal Isolation & Controlled Auxiliary Valve Override Flush"),
                description=action_plan.get("action_summary", "Adapted containment protocol submitted for human authorization."),
                priority="CRITICAL",
                human_approved=False
            )
            db.add(rec)

        db.commit()

        AuditService.record_event(
            db=db,
            incident_id=incident.id,
            actor_type="AGENT_RUNTIME",
            actor_id="AgentController",
            action_type="ACTION_RECOMMENDED",
            details={
                "action_title": action_plan.get("action_title"),
                "requires_human_approval": True,
                "risk_level": "CRITICAL"
            }
        )


agent_runtime = AgentRuntime()
