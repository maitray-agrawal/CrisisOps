# Industrial CrisisOps — Phased Execution Plan

## Executive Overview
Industrial CrisisOps is an AI-powered industrial incident investigation and response platform built for a 24-hour hackathon MVP. This document defines the step-by-step phased roadmap for developing, testing, and demonstrating the platform.

---

## Roadmap Summary

| Phase | Description | Key Deliverables | Status |
|---|---|---|---|
| **Phase 0** | Architecture, Planning & Project Specification | 9 Project Control Files, Architectural Specifications | **COMPLETED** |
| **Phase 1** | Foundation & Synthetic Data Layer | Directory Scaffold, Synthetic Telemetry Generator, SQLite DB Schema, Seed Data | **COMPLETED** |
| **Phase 2** | Premium Interactive UI/UX Foundation | React Dashboard Shell, Machine Inspector, Incidents Workspace, Dark Industrial Theme | **COMPLETED** |
| **Phase 3** | Telemetry Anomaly Engine & Live Pipeline | Telemetry Simulator, Explainable Anomaly Detector, State Transitions, Automated Incident Engine, Live Polling | **COMPLETED** |
| **Phase 4** | Controlled Agent Pipeline, SOP RAG & Human Approval Gate | 4 Sequential Agents (Signal, RCA, Impact, SOP), SOP RAG Retriever, Human Approval Gate, Simulated Actuation | **COMPLETED** |
| **Phase 5** | Auditability, Decision Ledger, Explainability & Incident Replay | SHA-256 Cryptographic Audit Ledger, Explainability RAG Maps, Time-Travel Incident Replay Engine | **COMPLETED** |
| **Phase 6** | Demo Hardening + Mission Control Experience | 7-Act Judge Demo Flow, Global State Sync, Operator UX Polish, Demo Guide | **COMPLETED** |

---

## Detailed Phase Specifications

### Phase 0: Project Initialization & Architecture (COMPLETED)
- Define problem statement, scope boundaries, and safety constraints.
- Create all 9 required project-control files (`PLAN.md`, `ARCHITECTURE.md`, `RULES.md`, `CONTEXT.md`, `MEMORY.md`, `STATE.md`, `TASK.md`, `CHANGELOG.md`, `DECISIONS.md`).
- Establish strict sequential agent workflow schemas and fallback rules.

### Phase 1: Core Foundation & Synthetic Data Layer (PENDING)
- **Backend Setup**: Scaffold FastAPI project structure with dependencies (`fastapi`, `pydantic`, `sqlite3` / `sqlalchemy`, `uvicorn`).
- **Data Generator**:
  - `telemetry_generator.py`: Generate realistic baseline operational signals (vibration, temp, output) for Machine M-204 and control machines.
  - `maintenance_generator.py`: Generate historical maintenance records (bearing replacements, lubrication history, technician notes).
  - `sop_repository`: Create structured markdown/JSON SOP files (e.g., `SOP-M204-BEARING.md`, `SOP-COOLING-PUMP.md`).
- **Database Initialization**: SQLite database setup with tables for Machines, Telemetry, Maintenance Logs, Incidents, and SOPs.

### Phase 2: Anomaly Detection Engine & Deterministic Baseline (PENDING)
- Implement `AnomalyDetector` service using rolling Z-Score / Exponentially Weighted Moving Average (EWMA) on incoming telemetry stream.
- Set threshold parameters: Normal vibration (1.5-2.5 mm/s), Anomaly alert (>4.5 mm/s), Critical incident (7.8 mm/s).
- Build automated incident creation pipeline when anomaly thresholds are breached.
- Implement deterministic fallback classifier for instant alert generation without LLM dependency.

### Phase 3: Controlled Sequential Agent Orchestration & RAG (PENDING)
- **Agent 1: Signal Correlator**: Consumes raw telemetry anomalies; outputs structured signal summary.
- **Agent 2: Root Cause Analysis (RCA) Agent**: Correlates telemetry signals with historical maintenance logs; outputs hypothesis, confidence score (0-100%), and supporting evidence list.
- **Agent 3: Impact Assessment Agent**: Calculates estimated downtime, financial loss, and operational risk rating.
- **Agent 4: SOP Retrieval & Response Agent**: Uses lightweight TF-IDF / vector search over SOP files; compiles step-by-step containment response plan.
- **Fallback Engine**: Implements static rule-based output fallback for each agent step in case of LLM timeout or parsing failure.

### Phase 4: Backend API & Execution Engine (PENDING)
- REST API routes:
  - `GET /api/telemetry/stream` (Live machine telemetry)
  - `GET /api/incidents` (Incident list & filter)
  - `GET /api/incidents/{id}` (Incident deep dive with RCA evidence & SOP response plan)
  - `POST /api/incidents/{id}/approve` (Human approval endpoint)
  - `POST /api/incidents/{id}/execute-simulated` (Simulated actuation execution)
- Human Approval Gate logic enforcing execution locks until user explicitly confirms.
- Simulation state modifier to mark Machine M-204 telemetry as stabilized and incident as CONTAINED.

### Phase 5: Modern Dashboard UI (React + TypeScript + Vite) (PENDING)
- Scaffold Vite React application with TypeScript.
- **UI Components**:
  - `Header`: System Status, Active Alerts indicator, Crisis Mode toggle.
  - `TelemetryView`: Real-time Recharts/Canvas visualizer for M-204 vibration/temp spikes.
  - `IncidentBanner`: Red/Orange alert box triggering war-room mode.
  - `RCAPanel`: Evidence card showing maintenance correlation, confidence gauge, and root-cause explanation.
  - `ImpactCard`: Financial & production risk breakdown ($45k potential loss, 24h downtime risk).
  - `SOPResponseCard`: Retrieved SOP steps, Human Approval toggle button, and "Execute Simulated Action" trigger.
  - `ContainmentVisualizer`: Live simulation readout showing machine telemetry returning to green baseline after action execution.

### Phase 6: End-to-End Hackathon Demo & Verification (PENDING)
- Execute complete demo scenario:
  1. M-204 Telemetry spike (Vibration: 7.8 mm/s, Temp: 88°C).
  2. Automatic incident generation.
  3. Historical correlation (Bearing last changed 14 months ago; 12-month rating).
  4. RCA hypothesis: Bearing Degradation (92% confidence).
  5. Business Impact: $45,000 loss estimate.
  6. SOP-M204-BEARING retrieved.
  7. Recommended Action: Software-guided Lockout & Automated Lubrication Flush.
  8. User clicks "Approve & Execute Simulated Action".
  9. System updates M-204 state to CONTAINED and stabilizes telemetry graphs.
- Stress test deterministic fallback mode by simulating LLM API timeout.
