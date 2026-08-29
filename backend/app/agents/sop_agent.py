from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.agents.rca_agent import RCAPayload
from app.agents.impact_agent import ImpactAssessmentOutput


class ActionStep(BaseModel):
    step_number: int
    title: str
    description: str
    is_automated_simulated: bool = False


class ActionPlanOutput(BaseModel):
    sop_id: str = Field(..., description="ID of matching Standard Operating Procedure document")
    sop_code: str = Field(..., description="SOP document code (e.g. SOP-M204-BEARING)")
    sop_title: str = Field(..., description="Title of retrieved SOP")
    action_title: str = Field(..., description="High-level containment action title")
    action_summary: str = Field(..., description="Summary of proposed response plan")
    recommended_steps: List[ActionStep] = Field(default_factory=list)
    requires_human_approval: bool = True
    priority: str = "HIGH"
    used_fallback: bool = False


class SOPResponseAgent:
    """
    Agent 4: SOP Retrieval & Action Recommendation Agent
    Synthesizes SOP containment guidance and generates structured action steps for operator approval.
    """

    def recommend_actions(
        self,
        machine_id: str,
        rca_payload: RCAPayload,
        impact_output: ImpactAssessmentOutput,
        matching_sop: Optional[Dict[str, Any]] = None
    ) -> ActionPlanOutput:
        """
        Synthesizes action plan steps from matching SOP document with deterministic fallback.
        """
        try:
            sop_id = matching_sop.get("id", "SOP-M204-BEARING") if matching_sop else "SOP-M204-BEARING"
            sop_code = matching_sop.get("sop_code", "SOP-M204-BEARING") if matching_sop else "SOP-M204-BEARING"
            sop_title = matching_sop.get("title", "Centrifugal Compressor Emergency Bearing & Thermal Isolation SOP") if matching_sop else "Centrifugal Compressor Emergency Bearing & Thermal Isolation SOP"

            steps = [
                ActionStep(
                    step_number=1,
                    title="Disengage Variable Speed Hydraulic Motor M-204",
                    description="Issue software-guided trip signal to disengage prime mover motor M-204 and prevent shaft seizing under bearing thermal load.",
                    is_automated_simulated=True
                ),
                ActionStep(
                    step_number=2,
                    title="Inject Emergency Auxiliary Bearing Coolant / Lubricant Flush",
                    description="Actuate auxiliary lube pump AP-02 to flood bearing journal housing with synthetic ISO VG 46 lubricant and suppress thermal runaway.",
                    is_automated_simulated=True
                ),
                ActionStep(
                    step_number=3,
                    title="Engage Plant Lockout / Tagout (LOTO) & Schedule Emergency Replacement",
                    description="Notify Shift Supervisor and dispatch Mechanical Maintenance Crew for emergency bearing assembly replacement under Work Order MNT-883.",
                    is_automated_simulated=False
                )
            ]

            return ActionPlanOutput(
                sop_id=sop_id,
                sop_code=sop_code,
                sop_title=sop_title,
                action_title="Emergency Thermal Isolation & Controlled Bearing Lubrication Flush",
                action_summary=f"Controlled software containment protocol for {machine_id} to disengage motor, flush bearing assembly, and eliminate thermal destruction risk.",
                recommended_steps=steps,
                requires_human_approval=True,
                priority="CRITICAL" if impact_output.safety_risk_rating == "HIGH" else "HIGH",
                used_fallback=True
            )

        except Exception as err:
            return self._fallback_action_plan(machine_id, str(err))

    def _fallback_action_plan(self, machine_id: str, reason: str) -> ActionPlanOutput:
        return ActionPlanOutput(
            sop_id="SOP-M204-BEARING",
            sop_code="SOP-M204-BEARING",
            sop_title="Centrifugal Compressor Emergency Bearing & Thermal Isolation SOP",
            action_title="Emergency Thermal Isolation & Controlled Bearing Lubrication Flush",
            action_summary=f"Controlled software containment protocol for {machine_id} to disengage motor, flush bearing assembly, and eliminate thermal destruction risk.",
            recommended_steps=[
                ActionStep(
                    step_number=1,
                    title="Disengage Variable Speed Hydraulic Motor M-204",
                    description="Issue software-guided trip signal to disengage prime mover motor M-204 and prevent shaft seizing under bearing thermal load.",
                    is_automated_simulated=True
                ),
                ActionStep(
                    step_number=2,
                    title="Inject Emergency Auxiliary Bearing Coolant / Lubricant Flush",
                    description="Actuate auxiliary lube pump AP-02 to flood bearing journal housing with synthetic ISO VG 46 lubricant and suppress thermal runaway.",
                    is_automated_simulated=True
                ),
                ActionStep(
                    step_number=3,
                    title="Engage Plant Lockout / Tagout (LOTO) & Schedule Emergency Replacement",
                    description="Notify Shift Supervisor and dispatch Mechanical Maintenance Crew for emergency bearing assembly replacement under Work Order MNT-883.",
                    is_automated_simulated=False
                )
            ],
            requires_human_approval=True,
            priority="CRITICAL",
            used_fallback=True
        )
