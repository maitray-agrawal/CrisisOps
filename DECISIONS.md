# Architectural Decision Records (ADRs)

This document records the architectural decisions made for **Industrial CrisisOps**.

---

## ADR-001: Sequential Agent Workflow vs Autonomous Multi-Agent Swarm

### Context
In AI-assisted industrial crisis platforms, agents could either communicate autonomously (swarm/mesh) or execute in a controlled linear order.

### Decision
We adopt a **strictly sequential agent pipeline**:
`Signal Correlator -> Root Cause Analysis -> Impact Assessment -> SOP Retrieval & Action Recommendation`.

### Rationale
- Autonomous swarms can loop indefinitely, introduce unpredictable latency, and create non-deterministic outputs inappropriate during emergency industrial response.
- Linear execution with explicit Pydantic input/output schemas guarantees deterministic execution, clean debugging, total explainability, and 100% hackathon demo reliability.

---

## ADR-002: Mandatory Human Approval Gate & Software-Only Simulation

### Context
Industrial automation systems control heavy machinery where erroneous AI actions can cause catastrophic hardware damage or safety hazards.

### Decision
All AI-generated response plans are strictly locked behind an explicit **Human Approval Gate** in the UI. Upon approval, actions execute only within a **software simulation environment** (modifying synthetic telemetry and machine status flags).

### Rationale
- Ensures absolute compliance with industrial safety principles ("Human in the Loop").
- Zero risk of dangerous hardware actuation.
- Simplifies hackathon setup by eliminating physical PLC/Modbus hardware dependencies.

---

## ADR-003: FastAPI + React/Vite + SQLite Architecture

### Context
We require a high-speed, modern, light-footprint stack executable on a single developer workstation without cloud dependencies.

### Decision
Use **Python FastAPI** for the backend, **React 18 + TypeScript + Vite** for the frontend dashboard, and **SQLite** for database persistence.

### Rationale
- Zero deployment friction.
- SQLite requires no daemon process and lives directly in the workspace directory.
- FastAPI provides automatic OpenAPI documentation and fast async request handling.

---

## ADR-004: In-Memory / Keyword-TF-IDF SOP Retrieval (RAG)

### Context
Standard Operating Procedures (SOPs) need to be retrieved dynamically based on the root cause hypothesis.

### Decision
Implement a lightweight, in-memory TF-IDF / keyword similarity retriever over local markdown files rather than deploying a heavy vector database cluster (e.g., Pinecone, Milvus, Qdrant).

### Rationale
- Eliminates external service API keys and Docker container requirements.
- Sub-millisecond retrieval performance for synthetic SOP catalogs.
- 100% reliable for hackathon demonstration.

---

## ADR-005: Statistical Telemetry Anomaly Detection & Deterministic Fallbacks

### Context
LLM API services may experience downtime, latency spikes, or rate limiting during a live demo.

### Decision
Integrate a statistical Z-Score/EWMA telemetry baseline anomaly detector and equip every AI agent wrapper with a pre-programmed **deterministic rule fallback**.

### Rationale
- Guarantees that even if LLM APIs fail completely, the platform instantly triggers anomalies, identifies Machine M-204 bearing degradation, displays estimated business impact, retrieves SOPs, and allows simulated containment.

---

## ADR-006: Backend-as-Source-of-Truth Telemetry Engine & Live Polling

### Context
Phase 3 requires transforming static baseline data into a dynamic operational pipeline capable of driving real-time frontend updates during live failure scenarios.

### Decision
Implement `TelemetrySimulator`, `AnomalyDetector`, `MachineStateEngine`, and `IncidentEngine` in `backend/app/services/`, controlled via FastAPI simulation endpoints (`/api/simulation/tick`, `/api/simulation/reset`, `/api/simulation/trigger-degradation`). The React frontend polls the REST endpoints at a controlled 3-second interval with event-based instant updates.

### Rationale
- Guarantees backend state consistency across all browser windows and API clients.
- Prevents UI state drift and provides deterministic control for hackathon evaluation and demonstration.

---

## ADR-007: SHA-256 Cryptographic Audit Chaining & Time-Travel Incident Replay

### Context
Industrial safety regulatory compliance requires tamper-evident logging of all autonomous agent operations, human approvals, and containment actuations, along with the ability to replay historical incidents step-by-step.

### Decision
Implement `AuditLog` model in SQLite utilizing SHA-256 hash signatures where each entry incorporates the hash of the preceding entry (`previous_hash -> current_hash`). Pair this with an `Incident Replay Engine` that synthesizes time-series snapshots of baseline/anomaly telemetry, agent events, human interventions, and machine state transitions into an interactive playback scrubber.

### Rationale
- Guarantees verifiable audit integrity against record tampering.
- Enables high-impact incident post-mortem analysis and interactive time-travel playback during live demonstrations.

