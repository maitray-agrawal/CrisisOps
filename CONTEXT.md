# Industrial CrisisOps — Permanent Project Context

## Product Identity
- **Name**: Industrial CrisisOps
- **Type**: Hackathon-Grade AI-Powered Industrial Incident Investigation and Response Platform
- **Purpose**: Rapidly detect industrial equipment anomalies, correlate operational signals with historical maintenance logs, identify probable root causes, calculate financial/production impact, retrieve relevant Standard Operating Procedures (SOPs), and recommend human-gated response plans.

---

## Core Problem Statement
Industrial plant operations teams receive fragmented operational signals:
1. Real-time sensor telemetry anomalies (vibration spikes, temperature elevations, throughput drops).
2. Historical maintenance records stored in disparate logging systems.
3. Complex, multi-page Standard Operating Procedure (SOP) manuals.

During an active industrial crisis, operators face cognitive overload. The core challenge is not alert detection, but **rapid incident investigation, explainable root cause analysis, risk quantification, SOP retrieval, and recommending safe containment actions under strict human oversight**.

---

## Hackathon Primary Demo Storyline (Machine M-204)

### Target Entity:
**Machine M-204**: Heavy-Duty Hydraulic Drive & Bearing Assembly in Main Production Line B.

### Incident Lifecycle:
1. **Detection**:
   - Machine M-204 telemetry experiences a sudden anomaly.
   - Vibration increases to **7.8 mm/s** (Baseline: 1.5 - 2.5 mm/s; Threshold: 4.5 mm/s).
   - Bearing Temperature reaches **88°C** (Baseline: 50 - 60°C; Threshold: 75°C).
   - Output drops from **100 units/min** to **62 units/min**.
   - System automatically generates Incident `INC-M204-001` (Severity: `CRITICAL`).

2. **Investigation & Historical Correlation**:
   - Agent 1 (Signal Correlator) analyzes telemetry trends.
   - Agent 2 (RCA Agent) cross-references telemetry with `maintenance_records`.
   - Discovers record `#MNT-882`: Bearing M-204-B was last replaced **14 months ago**.
   - Manufacturer specification rate for M-204-B bearing operational lifetime: **12 months max**.
   - Identifies leading root cause hypothesis: **Mechanical Bearing Degradation & Lubrication Starvation**.
   - Confidence Score: **92%**. Evidence list details lifetime overrun and characteristic vibration frequency.

3. **Impact Assessment**:
   - Agent 3 calculates production and financial exposure.
   - Production Downtime Risk: **24 hours unplanned stoppage**.
   - Financial Loss Exposure: **$45,000 USD** (unfilled customer orders + expedited replacement parts).
   - Safety Risk Level: **HIGH** (Risk of total bearing seizure and housing structural crack).

4. **SOP Knowledge Retrieval & Recommendation**:
   - Agent 4 queries the SOP vector/keyword database for `Machine M-204 Bearing Degradation`.
   - Retrieves `SOP-M204-BEARING` (Standard Emergency Operating Procedure for Drive Bearing Failure).
   - Compiles recommended containment response plan:
     - Step 1: Disengage main drive hydraulic load.
     - Step 2: Trigger auxiliary lubrication flush & emergency cooling feed.
     - Step 3: Dispatch Tier-2 Maintenance Crew with replacement unit `#BRG-M204-SPARE`.

5. **Human Approval & Simulated Execution**:
   - System locks action execution behind a **Human Approval Gate**.
   - Operator reviews evidence, RCA explanation, and retrieved SOP snippet in the UI.
   - Operator approves the response plan.
   - Operator executes simulated action.
   - System updates Machine M-204 status to `CONTAINED`, stabilizes telemetry graphs, and logs full audit trail.

---

## Technical Architectural Principles
- **Controlled Agent Orchestration**: Strict sequential agent pipeline. No free-form autonomous multi-agent chatter.
- **Safety First**: No autonomous physical actuation. All actions require explicit human approval.
- **Deterministic Reliability**: Fallback rule engines ensure 100% demo availability even if LLM APIs fail.
- **Zero Overhead Architecture**: Single Python FastAPI backend + SQLite DB + Single React Vite UI.
