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

## Phase 2: Anomaly Detection Engine (PENDING)
- [ ] Implement statistical anomaly detector (`backend/app/services/detector.py`)
- [ ] Implement threshold monitoring for vibration, temperature, and output metrics
- [ ] Connect live detection alerts to database incident generator
- [ ] Add real-time anomaly status indicators to frontend

## Phase 3: Agent Orchestrator & SOP Retriever (PENDING)
- [ ] Implement LangChain / LLM multi-agent workflow
- [ ] Build SOP document embedding & vector search retriever
- [ ] Implement root cause synthesis and action recommendation engine
- [ ] Add human-in-the-loop approval workflow to frontend
