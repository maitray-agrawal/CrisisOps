import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.services.agent_runtime import agent_runtime, AgentState

logger = logging.getLogger("crisisops.orchestrator")


class MultiAgentOrchestrator:
    """
    Multi-Agent Runtime Orchestrator
    Delegates to the central AgentRuntime controller for dynamic tool selection,
    stateful execution, failure adaptation, and goal verification.
    """

    def run_investigation_pipeline(
        self,
        db: Session,
        incident_id: str
    ) -> Dict[str, Any]:
        """
        Executes goal-driven dynamic investigation and adaptive containment planning.
        """
        state: AgentState = agent_runtime.run_investigation(db, incident_id)

        signal_analysis = state.observations.get("signal_analysis", {})
        root_cause_analysis = state.observations.get("root_cause", {})
        impact_assessment = state.observations.get("impact", {})
        sop_data = state.observations.get("sop", {})
        matching_sop = sop_data.get("matched_sop")
        action_plan = state.pending_action or {}

        return {
            "incident_id": state.incident_id,
            "machine_id": state.machine_id,
            "signal_analysis": signal_analysis,
            "root_cause_analysis": root_cause_analysis,
            "impact_assessment": impact_assessment,
            "action_plan": action_plan,
            "retrieved_sop": matching_sop,
            "pipeline_status": "COMPLETED",
            "executed_at": datetime.now(timezone.utc).isoformat(),
            # Agent Runtime enhancements
            "goal": state.goal,
            "agent_status": state.status,
            "agent_runtime_trace": [t.model_dump() for t in state.trace],
            "selected_tools": state.selected_tools,
            "completed_tools": state.completed_tools,
            "failed_actions": state.failed_actions,
            "adaptation_events": state.adaptation_events,
            "confidence_score": state.confidence,
            "risk_level": state.risk_level,
            "verification_results": state.verification_results
        }


agent_orchestrator = MultiAgentOrchestrator()
