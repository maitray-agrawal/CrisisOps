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
