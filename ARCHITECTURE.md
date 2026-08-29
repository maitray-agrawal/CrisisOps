# Industrial CrisisOps — Technical Architecture Specification

## 1. System Architecture Overview

Industrial CrisisOps is built as a highly robust, low-latency, modular monolith optimized for rapid 24-hour hackathon execution and high-impact live demonstration.

```
+-----------------------------------------------------------------------------------+
|                                 REACT FRONTEND                                    |
|   (Vite + TypeScript + Modern Dark Theme + Recharts + Live Crisis Control Panel)  |
+-----------------------------------------------------------------------------------+
                                          |
                                    REST API (JSON)
                                          |
+-----------------------------------------------------------------------------------+
|                                 FASTAPI BACKEND                                   |
|                                                                                   |
|  +---------------------+  +-------------------------+  +-----------------------+  |
|  | Telemetry & Anomaly |  |  Controlled Sequential  |  |   SOP Retrieval Engine|  |
|  | Statistical Engine  |  |    Agent Orchestrator   |  |   (Lightweight RAG)   |  |
|  +---------------------+  +-------------------------+  +-----------------------+  |
|             |                         |                            |              |
|  +-----------------------------------------------------------------------------+  |
|  |                        Human Approval Gate & Simulation Engine              |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                          |
                                    SQLite Storage
                                          |
+-----------------------------------------------------------------------------------+
|                                  LOCAL DATA STORE                                 |
|    - Machines  - Telemetry Logs  - Maintenance Records  - Incidents  - SOP Docs   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Backend Architecture

The backend is built in Python using FastAPI, structured into four clear, decoupled layers:

1. **API Layer (`app/api/`)**: Exposes RESTful JSON endpoints. Uses Pydantic models for strict input validation and response serialization.
2. **Service Layer (`app/services/`)**:
   - `telemetry_service`: Stream reader & anomaly calculator.
   - `incident_service`: Incident creation & state transition manager.
   - `agent_orchestrator`: Manages execution of the 4-stage sequential agent pipeline.
   - `sop_rag_service`: In-memory keyword/TF-IDF document indexer and similarity retriever.
   - `simulation_engine`: Handles simulated actuation execution post-human approval.
3. **Agent Layer (`app/agents/`)**:
   - Explicit agent wrappers with typed input/output Pydantic schemas.
   - Isolated deterministic fallback handlers for each agent.
4. **Data Access Layer (`app/db/`)**:
   - SQLite database accessor (`sqlite3` / SQLAlchemy core).
   - Seed data script for initial Machine M-204 telemetry, historical maintenance records, and SOP markdown files.

---

## 3. Frontend Architecture

The frontend is a single-page application (SPA) built with React 18, TypeScript, and Vite.

### Component Structure:
- `src/components/common`: Reusable UI tokens (Badge, Button, Card, Modal, StatusPill).
- `src/components/telemetry`: `LiveTelemetryChart` (Recharts time-series graphs for vibration and temperature).
- `src/components/incident`: `IncidentHeader`, `IncidentTimeline`, `RCAPanel`, `ImpactCard`.
- `src/components/sop`: `SOPViewer`, `ActionPlanList`.
- `src/components/simulation`: `HumanApprovalGateModal`, `SimulationControlPanel`.

### State Management:
- Local React context (`IncidentContext`) for managing active crisis state, telemetry polling interval, and approval flow.

---

## 4. Data Model Specification

```sql
-- Machines Table
CREATE TABLE machines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL -- 'NORMAL', 'WARNING', 'CRITICAL', 'CONTAINED'
);

-- Telemetry Records Table
CREATE TABLE telemetry_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    vibration_mm_s REAL NOT NULL,
    temp_celsius REAL NOT NULL,
    output_units_min REAL NOT NULL,
    is_anomaly BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY(machine_id) REFERENCES machines(id)
);

-- Maintenance Records Table
CREATE TABLE maintenance_records (
    id TEXT PRIMARY KEY,
    machine_id TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    component TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    technician TEXT NOT NULL,
    notes TEXT NOT NULL,
    FOREIGN KEY(machine_id) REFERENCES machines(id)
);

-- Incidents Table
CREATE TABLE incidents (
    id TEXT PRIMARY KEY,
    machine_id TEXT NOT NULL,
    title TEXT NOT NULL,
    severity TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status TEXT NOT NULL,   -- 'OPEN', 'INVESTIGATING', 'PENDING_APPROVAL', 'CONTAINED'
    created_at DATETIME NOT NULL,
    resolved_at DATETIME,
    FOREIGN KEY(machine_id) REFERENCES machines(id)
);

-- Root Cause Hypotheses Table
CREATE TABLE root_cause_hypotheses (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    hypothesis TEXT NOT NULL,
    confidence_score REAL NOT NULL, -- 0.0 to 100.0
    evidence_json TEXT NOT NULL,    -- JSON list of supporting strings
    used_fallback BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY(incident_id) REFERENCES incidents(id)
);

-- Impact Assessments Table
CREATE TABLE impact_assessments (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    estimated_downtime_hours REAL NOT NULL,
    estimated_financial_loss_usd REAL NOT NULL,
    safety_risk_rating TEXT NOT NULL, -- 'LOW', 'MODERATE', 'HIGH', 'SEVERE'
    summary TEXT NOT NULL,
    FOREIGN KEY(incident_id) REFERENCES incidents(id)
);

-- SOP Documents Table
CREATE TABLE sop_documents (
    id TEXT PRIMARY KEY,
    sop_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    target_component TEXT NOT NULL,
    content_markdown TEXT NOT NULL
);

-- Response Plans Table
CREATE TABLE response_plans (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    sop_id TEXT NOT NULL,
    recommended_steps_json TEXT NOT NULL, -- JSON array of steps
    human_approved BOOLEAN NOT NULL DEFAULT 0,
    approved_by TEXT,
    approved_at DATETIME,
    simulation_executed BOOLEAN NOT NULL DEFAULT 0,
    executed_at DATETIME,
    FOREIGN KEY(incident_id) REFERENCES incidents(id),
    FOREIGN KEY(sop_id) REFERENCES sop_documents(id)
);
```

---

## 5. API Strategy & Interface Contracts

All endpoints return standardized JSON structures.

### Standard Response Schemas:
- `GET /api/machines/{id}/telemetry?limit=50`: Returns time-series telemetry records.
- `GET /api/incidents`: Returns active incidents list.
- `POST /api/incidents/trigger-demo`: Forces the Machine M-204 bearing degradation incident injection.
- `GET /api/incidents/{id}/investigation`: Runs/fetches the full 4-agent analysis report.
- `POST /api/incidents/{id}/approve`: Registers human approval for recommended response plan.
- `POST /api/incidents/{id}/execute-simulation`: Executes simulated containment, updates machine state to `CONTAINED`.

---

## 6. Agent Architecture (Controlled Sequential Pipeline)

To guarantee 100% execution reliability, predictability, and safety, agent execution is strictly sequential with rigid Pydantic schema validation. Unrestricted agent-to-agent communication is forbidden.

```
[Telemetry Anomaly Trigger]
           │
           ▼
┌─────────────────────────┐
│ Agent 1: Signal         │ Input: Telemetry anomaly data
│ Correlator Agent        │ Output: Structured anomaly payload
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Agent 2: Root Cause     │ Input: Anomaly payload + Maintenance History
│ Analysis (RCA) Agent    │ Output: Hypothesis, Confidence %, Evidence List
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Agent 3: Impact         │ Input: RCA Hypothesis + Machine Metadata
│ Assessment Agent        │ Output: Downtime Est, Financial Est, Risk Level
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Agent 4: SOP Retrieval &│ Input: RCA Hypothesis + Impact Assessment
│ Response Rec. Agent     │ Output: SOP Reference + Action Plan JSON
└──────────┬──────────────┘
           │
           ▼
[Human Approval Gate] ───(Approve)───► [Simulated Response Execution]
```

### Agent Fallback Strategy:
Each agent wrapper catches LLM API errors, timeout errors (>5 seconds), or Pydantic validation failures. When triggered, the agent returns a deterministic fallback response calculated via pre-coded heuristic rules, setting `used_fallback: true` in the output metadata.

---

## 7. End-to-End Data Flow (Machine M-204 Scenario)

1. **Ingest & Detect**: `telemetry_generator` emits M-204 telemetry spike (Vibration 7.8 mm/s, Temp 88°C). `AnomalyDetector` triggers an `Incident` (ID: `INC-M204-001`, Severity: `CRITICAL`).
2. **Signal Correlation**: Agent 1 formats raw telemetry into an anomaly summary: "Vibration threshold exceeded by 212%, bearing temperature +33°C above baseline."
3. **RCA Generation**: Agent 2 checks `maintenance_records` (Bearing replaced 14 months ago; rating 12 months). Output: "Bearing Degradation due to fatigue & lack of lubrication", Confidence: `92%`, Evidence: `["Vibration harmonics at 7.8 mm/s", "Maintenance log #MNT-882 indicates bearing lifetime exceeded by 2 months"]`.
4. **Impact Estimation**: Agent 3 calculates: "Estimated 24 hours unplanned production stoppage; Financial Loss Estimate: $45,000; Risk Rating: HIGH".
5. **SOP RAG Retrieval**: Agent 4 queries vector/keyword store for "M-204 bearing degradation". Retrieves `SOP-M204-BEARING`. Compiles response plan: Step 1: Disengage hydraulic motor M-204. Step 2: Inject auxiliary bearing coolant/lubricant. Step 3: Schedule emergency bearing swap.
6. **Human Approval**: Dashboard displays complete investigation card. Operator reviews evidence, confidence score, and SOP. Operator clicks **"Approve Plan"**.
7. **Simulated Execution**: User clicks **"Execute Simulated Action"**. Backend updates M-204 state to `CONTAINED`, alters telemetry generator to output normal baseline values (Vibration 1.8 mm/s, Temp 52°C), and logs execution details.

---

## 8. Failure Handling & Resilience Strategy

1. **LLM Provider Outage / Rate Limit**:
   - Automatic fallback to deterministic rule engine within 500ms.
   - UI displays a subtle "Deterministic Fallback Active" badge for explainability.
2. **Malformed LLM Output**:
   - Pydantic schema validation catches missing fields or invalid types.
   - Triggers retry once with schema prompt; if still invalid, routes to deterministic fallback.
3. **Missing SOP Matches**:
   - Fallback to generic `SOP-GENERIC-INDUSTRIAL-ISOLATION` response template.
4. **Frontend API Disconnection**:
   - Re-try polling with exponential backoff; displays offline warning banner without crashing the UI.
