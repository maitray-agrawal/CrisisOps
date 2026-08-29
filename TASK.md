# Task Checklist — Industrial CrisisOps

## Phase 1: Foundation (COMPLETED)
- [x] Create project structure (`backend/` and `frontend/`)
- [x] Initialize FastAPI application with CORS middleware
- [x] Set up Pydantic settings & configuration management
- [x] Define SQLAlchemy database models (`Machine`, `TelemetryRecord`, `MaintenanceRecord`, `Incident`, `Evidence`, `SOPDocument`, `ActionRecommendation`)
- [x] Define Pydantic request/response schemas
- [x] Implement API routers (`/health`, `/machines`, `/incidents`, `/sops`)
- [x] Implement deterministic database seed script (`backend/app/db/seed.py`)
- [x] Create unit test suite with 100% pass rate (`backend/tests/`)
- [x] Scaffold React + TypeScript + Vite frontend
- [x] Build API service layer (`frontend/src/services/api.ts`)
- [x] Create dashboard, incident investigation, and machine telemetry views
- [x] Verify frontend TypeScript compilation and production build

## Phase 2: Ultra-Premium UI/UX Command Center (COMPLETED)
- [x] Upgrade design system CSS custom properties and industrial theme tokens
- [x] Build persistent left navigation shell (`Layout.tsx`) and header status bar
- [x] Transform Dashboard into operations command center with KPI grid and AI copilot (`DashboardPage.tsx`)
- [x] Implement multi-stage AI investigation workspace (`IncidentsPage.tsx`)
- [x] Refine machine telemetry inspector view (`MachinesPage.tsx`)
- [x] Verify frontend build (`npm run build`)

## Phase 3: Telemetry Anomaly Engine & Live Pipeline (COMPLETED)
- [x] 3A: Telemetry Simulation Engine (`backend/app/services/telemetry.py`)
  - [x] Implement realistic baseline telemetry generator with temporal continuity for M-204, M-101, M-305
  - [x] Build deterministic M-204 degradation sequence (NORMAL -> Degrading -> Critical)
  - [x] Implement simulation state store and tick/reset controls
- [x] 3B: Anomaly Detection Engine (`backend/app/services/detector.py`)
  - [x] Implement vibration threshold detector (> 2.5 mm/s warning, > 4.5 mm/s critical)
  - [x] Implement bearing temperature threshold detector (> 75°C)
  - [x] Implement production output degradation detector (> 30% drop)
  - [x] Format explainable anomaly outputs (WHAT, WHICH signal, observed vs expected, severity, WHY)
- [x] 3C: Machine State Engine (`backend/app/services/state_engine.py`)
  - [x] Implement state derivation logic (NORMAL -> WARNING -> ANOMALOUS -> CRITICAL -> CONTAINED)
  - [x] Persist machine state updates directly to database as telemetry ticks
- [x] 3D: Incident & Evidence Generator (`backend/app/services/incident_engine.py`)
  - [x] Automatically generate incident when machine breaches ANOMALOUS / CRITICAL thresholds
  - [x] Deduplicate active incidents per machine condition
  - [x] Attach telemetry & maintenance evidence items with confidence scores
  - [x] Attach matching SOP action recommendations
- [x] 3E: API Integration & Simulation Controls (`backend/app/api/simulation.py`)
  - [x] Expose `/api/simulation/tick`, `/api/simulation/reset`, `/api/simulation/trigger-degradation`
  - [x] Expose anomaly metrics and breakdown endpoints
- [x] 3F: Frontend Live Polling & Demo Controls (`frontend/`)
  - [x] Implement 3-5 second polling in `DashboardPage`, `IncidentsPage`, `MachinesPage`
  - [x] Add simulation control buttons (Trigger M-204 Degradation, Reset, Step Tick) to command shell
  - [x] Ensure live updates for KPIs, machine status badges, telemetry tables, and investigation pipeline
- [x] 3G: Testing & Build Validation
  - [x] Create pytest test suite `backend/tests/test_anomaly_engine.py` (10 required test cases)
  - [x] Validate backend test execution (`pytest` 21/21 passed)
  - [x] Validate frontend build (`npm run build` success)
- [x] 3H: Documentation & Git Checkpoint
  - [x] Update `STATE.md`, `TASK.md`, `CHANGELOG.md`, `DECISIONS.md`

## Phase 4: AI Root Cause, SOP Intelligence & Human Approval Gate (IN PLANNING)
- [ ] 4A: Sequential AI Agent Engine (`backend/app/agents/`)
  - [ ] Implement Agent 1: Signal Correlator Agent (`signal_agent.py`) with Pydantic output validation
  - [ ] Implement Agent 2: Root Cause Analysis (RCA) Agent (`rca_agent.py`) with maintenance correlation
  - [ ] Implement Agent 3: Impact Assessment Agent (`impact_agent.py`) calculating financial & downtime risk
  - [ ] Implement Agent 4: SOP Retrieval & Action Recommendation Agent (`sop_agent.py`)
  - [ ] Implement Agent Fallback Engine for instantaneous rule-based execution if LLM fails/times out
- [ ] 4B: In-Memory SOP RAG Retriever (`backend/app/services/sop_rag_service.py`)
  - [ ] Implement TF-IDF / keyword similarity matcher over database SOP documents & markdown catalog
  - [ ] Expose sub-millisecond SOP document search endpoint
- [ ] 4C: Multi-Agent Orchestrator Service (`backend/app/services/agent_orchestrator.py`)
  - [ ] Pipeline orchestrator coordinating Agents 1-4
  - [ ] Database persistence of hypotheses, impact reports, and response plans
- [ ] 4D: Human Approval Gate & Actuation Engine (`backend/app/services/actuation_engine.py`)
  - [ ] Implement Human Approval lock (`approve_plan`)
  - [ ] Implement simulated actuation execution (`execute_actuation`): update machine status to `CONTAINED`, reset M-204 telemetry baseline, resolve incident ticket
- [ ] 4E: Investigation API Endpoints (`backend/app/api/investigation.py`)
  - [ ] Expose `POST /api/incidents/{id}/investigate`
  - [ ] Expose `GET /api/incidents/{id}/investigation`
  - [ ] Expose `POST /api/incidents/{id}/approve`
  - [ ] Expose `POST /api/incidents/{id}/execute-actuation`
- [ ] 4F: Frontend Incidents Workspace Integration (`frontend/src/`)
  - [ ] Render Root Cause Hypothesis card with confidence gauge
  - [ ] Render correlated evidence checklist & maintenance history badges
  - [ ] Render Business Impact card ($45k potential loss, 24h downtime)
  - [ ] Render SOP Action Plan steps with Human Approval Gate toggle & Execute Containment Action trigger
- [ ] 4G: Pytest Suite & Build Verification (`backend/tests/test_agent_pipeline.py`)
  - [ ] Write unit tests for agent pipeline, fallback engine, RAG search, and actuation execution
  - [ ] Validate `pytest` pass rate
  - [ ] Validate `npm run build` with zero errors

