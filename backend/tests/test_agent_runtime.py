"""
Comprehensive Unit & Integration Tests for CrisisOps Agent Runtime.
Tests:
1. Dynamic tool selection based on agent state.
2. Prevention of redundant failed action re-execution.
3. Failure scenario: Precondition violation recorded in failed_actions.
4. Adaptive replanning: Strategy adapted and alternative plan formulated.
5. Success criteria evaluation (multi-point criteria).
6. Final verification determining resolution (PASS / FAIL).
7. High-risk action requiring human approval policy.
8. Ledger recording all execution events with hash chain.
9. Replay timeline reflecting full agent execution sequence.
10. End-to-end failure -> adaptation -> approval -> actuation -> verification flow.
"""

import pytest
from app.services.tool_registry import tool_registry
from app.services.agent_runtime import agent_runtime, AgentState
from app.services.actuation_engine import actuation_engine
from app.services.audit_service import AuditService
from app.services.replay_service import ReplayService
from app.models.models import Machine, Incident, ActionRecommendation, AuditLog


def test_tool_registry_registration_and_execution(db_session):
    tools = tool_registry.list_tools()
    tool_names = [t.name for t in tools]

    assert "get_machine_state" in tool_names
    assert "get_recent_telemetry" in tool_names
    assert "get_maintenance_history" in tool_names
    assert "correlate_signals" in tool_names
    assert "analyze_root_cause" in tool_names
    assert "calculate_business_impact" in tool_names
    assert "retrieve_relevant_sop" in tool_names
    assert "attempt_primary_containment" in tool_names
    assert "formulate_adapted_plan" in tool_names
    assert "verify_goal_criteria" in tool_names

    # Test execution of low-risk observation tool
    res = tool_registry.execute_tool("get_machine_state", db_session, {"machine_id": "M-204"})
    assert res["machine_id"] == "M-204"
    assert "status" in res


def test_agent_dynamic_tool_selection_sequence(db_session):
    # Setup test incident
    m = Machine(id="M-DYN-01", name="Dynamic Machine", type="Centrifugal Compressor", location="Unit 3", status="CRITICAL")
    db_session.add(m)
    inc = Incident(id="INC-DYN-001", machine_id="M-DYN-01", title="Dynamic Test Incident", severity="CRITICAL", status="OPEN")
    db_session.add(inc)
    db_session.commit()

    state = agent_runtime.run_investigation(db_session, "INC-DYN-001")

    # Verify state properties
    assert state.incident_id == "INC-DYN-001"
    assert state.machine_id == "M-DYN-01"
    assert "mitigate" in state.goal.lower()
    assert state.iteration >= 6
    assert len(state.trace) >= 6

    # Verify tool execution sequence occurred dynamically
    completed = state.completed_tools
    assert "get_recent_telemetry" in completed
    assert "correlate_signals" in completed
    assert "get_maintenance_history" in completed
    assert "analyze_root_cause" in completed
    assert "calculate_business_impact" in completed
    assert "retrieve_relevant_sop" in completed
    assert "attempt_primary_containment" in completed
    assert "formulate_adapted_plan" in completed

    # Cleanup
    db_session.delete(inc)
    db_session.delete(m)
    db_session.commit()


def test_failure_scenario_and_adaptation(db_session):
    """
    Test Phase 6 & 7: Primary direct flush encounters physical valve lock,
    fails gracefully, updates state, and triggers adaptive replanning.
    """
    m = Machine(id="M-FAIL-01", name="Failure Test Machine", type="Centrifugal Compressor", location="Unit 4", status="CRITICAL")
    db_session.add(m)
    inc = Incident(id="INC-FAIL-001", machine_id="M-FAIL-01", title="Precondition Test Incident", severity="CRITICAL", status="OPEN")
    db_session.add(inc)
    db_session.commit()

    state = agent_runtime.run_investigation(db_session, "INC-FAIL-001")

    # Verify failure recorded
    assert len(state.failed_actions) == 1
    failed_act = state.failed_actions[0]
    assert "Direct High-Speed" in failed_act["action"]
    assert "Precondition" in failed_act["reason"]

    # Verify adaptation event recorded
    assert len(state.adaptation_events) >= 1
    adapt_evt = state.adaptation_events[0]
    assert "Emergency Thermal Isolation" in adapt_evt["to_strategy"]

    # Verify adapted action plan in pending action
    assert state.pending_action is not None
    assert state.pending_action.get("adapted_from_failure") is True
    assert "Valve Override" in state.pending_action.get("action_title")

    # Cleanup
    db_session.delete(inc)
    db_session.delete(m)
    db_session.commit()


def test_agent_does_not_repeat_failed_action(db_session):
    """
    Test Phase 4 & 6: Agent does not blindly repeat the failed action.
    """
    m = Machine(id="M-NOREP-01", name="No Repeat Machine", type="Centrifugal Compressor", location="Unit 5", status="CRITICAL")
    db_session.add(m)
    inc = Incident(id="INC-NOREP-001", machine_id="M-NOREP-01", title="No Repeat Incident", severity="CRITICAL", status="OPEN")
    db_session.add(inc)
    db_session.commit()

    state = agent_runtime.run_investigation(db_session, "INC-NOREP-001")

    # Ensure 'attempt_primary_containment' was attempted only once and not repeated
    attempt_count = state.completed_tools.count("attempt_primary_containment")
    assert attempt_count == 1

    # Cleanup
    db_session.delete(inc)
    db_session.delete(m)
    db_session.commit()


def test_explicit_success_criteria_and_verification(db_session):
    """
    Test Phase 5: Multi-point success criteria verification.
    """
    m = Machine(id="M-VERIF-01", name="Verif Machine", type="Centrifugal Compressor", location="Unit 6", status="CONTAINED")
    db_session.add(m)
    inc = Incident(id="INC-VERIF-001", machine_id="M-VERIF-01", title="Verif Incident", severity="CRITICAL", status="CONTAINED")
    db_session.add(inc)
    db_session.commit()

    verif_res = tool_registry.execute_tool("verify_goal_criteria", db_session, {
        "machine_id": "M-VERIF-01",
        "incident_id": "INC-VERIF-001"
    })

    assert "goal_achieved" in verif_res
    assert len(verif_res["criteria"]) == 5

    metric_names = [c["metric"] for c in verif_res["criteria"]]
    assert "Machine Operating State" in metric_names
    assert "Vibration Amplitude" in metric_names
    assert "Bearing Temperature" in metric_names
    assert "Production Output Rate" in metric_names
    assert "Incident Lifecycle State" in metric_names

    # Machine and incident are CONTAINED, so those should PASS
    machine_state_crit = next(c for c in verif_res["criteria"] if c["metric"] == "Machine Operating State")
    assert machine_state_crit["status"] == "PASS"

    incident_state_crit = next(c for c in verif_res["criteria"] if c["metric"] == "Incident Lifecycle State")
    assert incident_state_crit["status"] == "PASS"

    # Cleanup
    db_session.delete(inc)
    db_session.delete(m)
    db_session.commit()


def test_decision_ledger_records_agentic_events(db_session):
    """
    Test Phase 9: SHA-256 Decision Ledger records actual agent lifecycle events.
    """
    m = Machine(id="M-LEDGER-01", name="Ledger Machine", type="Centrifugal Compressor", location="Unit 7", status="CRITICAL")
    db_session.add(m)
    inc = Incident(id="INC-LEDGER-001", machine_id="M-LEDGER-01", title="Ledger Incident", severity="CRITICAL", status="OPEN")
    db_session.add(inc)
    db_session.commit()

    agent_runtime.run_investigation(db_session, "INC-LEDGER-001")

    logs = db_session.query(AuditLog).filter(AuditLog.incident_id == "INC-LEDGER-001").all()
    action_types = [l.action_type for l in logs]

    assert "GOAL_INITIALIZED" in action_types
    assert "TOOL_SELECTED" in action_types
    assert "ACTION_ATTEMPT_FAILED" in action_types
    assert "STRATEGY_ADAPTED" in action_types
    assert "ACTION_RECOMMENDED" in action_types
    assert "GOAL_VERIFICATION_EVALUATED" in action_types

    # Verify SHA-256 hash continuity
    verification = AuditService.verify_ledger_integrity(db_session, "INC-LEDGER-001")
    assert verification.is_valid is True

    # Cleanup
    db_session.delete(inc)
    db_session.delete(m)
    db_session.commit()


def test_full_end_to_end_adaptive_recovery_flow(db_session):
    """
    Test Phase 23: Complete demo flow:
    Incident -> Autonomous Investigation -> Action Attempt Fails ->
    Agent Adapts -> Recommends Override Plan -> Human Approval ->
    Actuation -> Goal Verification -> Ledger Verified.
    """
    m = Machine(id="M-E2E-01", name="E2E Machine", type="Centrifugal Compressor", location="Unit 8", status="CRITICAL")
    db_session.add(m)
    inc = Incident(id="INC-E2E-001", machine_id="M-E2E-01", title="E2E Critical Degradation", severity="CRITICAL", status="OPEN")
    db_session.add(inc)
    db_session.commit()

    # Step 1: Agent Runtime investigates, encounters valve lock, adapts plan
    state = agent_runtime.run_investigation(db_session, "INC-E2E-001")
    assert state.status == "ACTION_PROPOSED"
    assert len(state.failed_actions) == 1
    assert len(state.adaptation_events) >= 1

    # Step 2: Policy requires Human Approval
    with pytest.raises(PermissionError):
        actuation_engine.execute_simulated_actuation(db_session, "INC-E2E-001")

    # Step 3: Operator reviews and authorizes adapted plan
    appr_res = actuation_engine.approve_action_plan(db_session, "INC-E2E-001", "Shift Lead Operator #42")
    assert appr_res["human_approved"] is True

    # Step 4: Actuation executed
    act_res = actuation_engine.execute_simulated_actuation(db_session, "INC-E2E-001")
    assert act_res["machine_status"] == "CONTAINED"
    assert act_res["incident_status"] == "CONTAINED"

    # Step 5: Final Goal Verification passes
    final_verif = tool_registry.execute_tool("verify_goal_criteria", db_session, {
        "machine_id": "M-E2E-01",
        "incident_id": "INC-E2E-001"
    })
    assert final_verif["goal_achieved"] is True

    # Step 6: Decision Ledger integrity holds
    verif = AuditService.verify_ledger_integrity(db_session, "INC-E2E-001")
    assert verif.is_valid is True

    # Step 7: Replay Timeline reflects all events
    replay = ReplayService.generate_incident_replay(db_session, "INC-E2E-001")
    assert replay.total_steps > 0
    event_titles = [s.event_title for s in replay.steps]
    assert any("Actuation Executed" in t for t in event_titles)

    # Cleanup
    db_session.delete(inc)
    db_session.delete(m)
    db_session.commit()
