import pytest
from app.agents.signal_agent import SignalCorrelatorAgent
from app.agents.rca_agent import RootCauseAnalysisAgent
from app.agents.impact_agent import ImpactAssessmentAgent
from app.agents.sop_agent import SOPResponseAgent
from app.services.sop_rag_service import sop_rag_service
from app.services.agent_orchestrator import agent_orchestrator
from app.services.actuation_engine import actuation_engine
from app.models.models import Machine, Incident, MaintenanceRecord, SOPDocument


def test_agent_1_signal_correlator():
    agent = SignalCorrelatorAgent()
    telemetry = [
        {"vibration_mm_s": 7.82, "temp_celsius": 88.4, "output_units_min": 64.0}
    ]
    res = agent.analyze_signals("M-204", telemetry)
    assert res.primary_anomaly == "vibration_mm_s"
    assert res.variance_pct > 200.0
    assert len(res.anomalous_signals) >= 2


def test_agent_2_rca():
    signal_agent = SignalCorrelatorAgent()
    rca_agent = RootCauseAnalysisAgent()

    telemetry = [{"vibration_mm_s": 7.82, "temp_celsius": 88.4, "output_units_min": 64.0}]
    sig_out = signal_agent.analyze_signals("M-204", telemetry)

    maint = [
        {
            "id": "MNT-882",
            "component": "Drive Stage Journal Bearing Assembly",
            "action_taken": "Full Bearing Replacement",
            "technician": "Sarah Jenkins",
            "notes": "Replaced primary drive journal bearing due to normal wear. Next scheduled overhaul in 12 months."
        }
    ]
    rca_out = rca_agent.analyze_root_cause("M-204", sig_out, maint)

    assert rca_out.confidence_score >= 90.0
    assert "MNT-882" in rca_out.correlated_maintenance_id
    assert len(rca_out.evidence_items) >= 2


def test_agent_3_impact_assessment():
    rca_agent = RootCauseAnalysisAgent()
    impact_agent = ImpactAssessmentAgent()

    sig_out = SignalCorrelatorAgent().analyze_signals("M-204", [{"vibration_mm_s": 7.82, "temp_celsius": 88.4, "output_units_min": 64.0}])
    rca_out = rca_agent.analyze_root_cause("M-204", sig_out, [])

    impact_out = impact_agent.assess_impact("M-204", rca_out)
    assert impact_out.estimated_downtime_hours == 24.0
    assert impact_out.estimated_financial_loss_usd == 45000.0
    assert impact_out.safety_risk_rating in ["HIGH", "SEVERE", "MODERATE"]


def test_agent_4_sop_recommendation():
    sop_agent = SOPResponseAgent()
    rca_out = RootCauseAnalysisAgent()._fallback_rca("M-204", "Test")
    impact_out = ImpactAssessmentAgent()._fallback_impact("M-204", "Test")

    sop_out = sop_agent.recommend_actions("M-204", rca_out, impact_out)
    assert sop_out.sop_code == "SOP-M204-BEARING"
    assert len(sop_out.recommended_steps) == 3
    assert sop_out.requires_human_approval is True


def test_sop_rag_service(db_session):
    sops = sop_rag_service.search_sops(
        db=db_session,
        query="Centrifugal Compressor M-204 bearing failure thermal spike vibration",
        target_component="Centrifugal Compressor"
    )
    assert len(sops) > 0
    assert "M204" in sops[0]["sop_code"] or "BEARING" in sops[0]["sop_code"]


def test_human_approval_and_actuation_flow(db_session):
    # Create test machine & incident
    m = Machine(id="M-TEST", name="Test Machine", type="Test Type", location="Unit 1", status="CRITICAL")
    db_session.add(m)
    inc = Incident(id="INC-TEST-001", machine_id="M-TEST", title="Test Critical Incident", severity="CRITICAL", status="OPEN")
    db_session.add(inc)
    db_session.commit()

    # Step 1: Run Orchestrator Pipeline
    orch_res = agent_orchestrator.run_investigation_pipeline(db_session, "INC-TEST-001")
    assert orch_res["pipeline_status"] == "COMPLETED"

    # Step 2: Test Human Approval Gate
    appr_res = actuation_engine.approve_action_plan(db_session, "INC-TEST-001", "Operator Alice")
    assert appr_res["status"] == "APPROVED"
    assert appr_res["human_approved"] is True

    # Step 3: Test Actuation Execution
    act_res = actuation_engine.execute_simulated_actuation(db_session, "INC-TEST-001")
    assert act_res["machine_status"] == "CONTAINED"
    assert act_res["incident_status"] == "CONTAINED"
    assert act_res["telemetry_stabilized"] is True

    # Cleanup test records
    db_session.delete(inc)
    db_session.delete(m)
    db_session.commit()
