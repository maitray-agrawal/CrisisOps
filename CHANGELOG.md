# Changelog — Industrial CrisisOps

All notable changes to this project will be documented in this file.

## [v0.3.0] - 2026-08-29
### Added
- **4-Stage AI Pipeline**: Implemented `SignalCorrelatorAgent`, `RootCauseAnalysisAgent`, `ImpactAssessmentAgent`, and `SOPResponseAgent` with deterministic fallback mechanisms for hackathon reliability.
- **Multi-Agent Orchestrator**: Developed `agent_orchestrator.py` managing sequential step execution, database persistence, and schema-validated state transitions.
- **In-Memory SOP RAG Engine**: Built `sop_rag_service.py` featuring keyword & TF-IDF relevance scoring against stored markdown SOP documents.
- **Human Approval & Containment Actuation**: Created `actuation_engine.py` enforcing operator authorization before triggering automated simulation reset and marking incident state as `CONTAINED`.
- **Investigation API Surface**: Exposed `/api/incidents/{id}/investigate`, `/api/incidents/{id}/investigation`, `/api/incidents/{id}/approve`, and `/api/incidents/{id}/execute-actuation`.
- **Frontend Workspace Enhancements**: Integrated 4-agent status stage visualizer, business impact metric cards ($45,000 loss / 24h downtime), human approval gate toggle, and green containment execution button in `IncidentsPage.tsx`.
- **Full Verification Suite**: 27/27 pytest tests passing; Vite production build (`npm run build`) passing with 0 errors.

## [v0.2.0] - 2026-08-29
### Added
- **Telemetry Simulation Engine**: `TelemetrySimulator` (`backend/app/services/telemetry.py`) for live bounded sensor stream generation and deterministic M-204 Centrifugal Compressor bearing degradation flow.
- **Explainable Anomaly Detector**: `AnomalyDetector` (`backend/app/services/detector.py`) evaluating Vibration (>2.5 mm/s, >4.5 mm/s), Temperature (>75°C), and Output rate drop (>30%) with structured explanation fields.
- **Machine State Transition Engine**: `MachineStateEngine` (`backend/app/services/state_engine.py`) managing derived asset states (`NORMAL`, `WARNING`, `ANOMALOUS`, `CRITICAL`, `CONTAINED`).
- **Automated Incident & Evidence Engine**: `IncidentEngine` (`backend/app/services/incident_engine.py`) automatically creating incident tickets, attaching telemetry & maintenance evidence (`MNT-882`), and linking matching SOP action recommendations.
- **Simulation Control APIs**: REST endpoints `/api/simulation/tick`, `/api/simulation/reset`, `/api/simulation/trigger-degradation`, and `/api/simulation/anomalies/{id}`.
- **Frontend Live Polling & Demo Controls**: Added 3-second background polling and interactive header control widgets ("Trigger M-204 Failure", "Step Tick", "Reset Demo") across `DashboardPage`, `IncidentsPage`, and `MachinesPage`.
- **Phase 3 Test Suite**: Added 10 deterministic test cases in `backend/tests/test_anomaly_engine.py` (21/21 passing tests).

## [v0.1.0] - 2026-08-29
### Added
- **Backend Scaffolding**: Modular FastAPI monolith with `core`, `models`, `schemas`, `api`, and `db` packages.
- **Database Layer**: SQLite database setup with SQLAlchemy ORM models for `Machine`, `TelemetryRecord`, `MaintenanceRecord`, `Incident`, `Evidence`, `SOPDocument`, and `ActionRecommendation`.
- **API Endpoints**: RESTful routes for system health check, machines & telemetry, incidents & evidence, and SOP documentation.
- **Deterministic Seed Data**: Synthetic dataset generator in `backend/app/db/seed.py` simulating Machine M-204 bearing degradation incident.
- **Test Suite**: Pytest suite (`backend/tests/`) verifying health check, machine endpoints, incident workflows, and SOP retrievals (11 tests passing).
- **Frontend Core**: React 18 + TypeScript + Vite frontend (`frontend/`) with dark industrial control theme styling (`index.css`).
- **Frontend Pages**: Reusable layout shell with tabs for Dashboard, Incident Deep-Dive, and Machine Asset Telemetry view.
- **API Integration**: Type-safe frontend API service layer (`src/services/api.ts`).
