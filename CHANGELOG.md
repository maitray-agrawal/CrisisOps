# Changelog — Industrial CrisisOps

All notable changes to this project will be documented in this file.

## [v0.7.0] - 2026-08-29
### Added
- **Actuation Safety Invariants**: Implemented strict human-in-the-loop authorization invariant in `actuation_engine.py` requiring explicit `ActionRecommendation` and `human_approved=True` before machine containment actuation can be executed.
- **Safety Invariant Regression Suite**: Added unit tests in `test_agent_pipeline.py` covering NO_RECOMMENDATION -> DENY, UNAPPROVED_RECOMMENDATION -> DENY, APPROVED_RECOMMENDATION -> ALLOW.
- **Repository Hygiene**: Purged and untracked all Python bytecode (`__pycache__` and `*.pyc` files) from Git index.
- **Verification Suite**: 31/31 backend unit tests passing (`pytest`); Vite production build (`npm run build`) passing cleanly with 0 errors.

## [v0.6.0] - 2026-08-29
### Added
- **AI Agent Stepper Pipeline (`AgentStepper.tsx`)**: Created visual 4-stage pipeline stepper displaying agent lifecycle states (`IDLE`, `RUNNING`, `COMPLETE`, `FALLBACK`) with source grounding indicators.
- **Explainable Risk Telemetry**: Added transparent telemetry anomaly Z-Score cards and financial downtime risk estimation breakdowns in `IncidentsPage.tsx`.
- **Web Crypto SHA-256 Hash Inspector (`HashVerifierModal.tsx`)**: Built live browser-native Web Crypto API (`crypto.subtle.digest`) SHA-256 hash recalculation and payload editing interface to demonstrate tamper detection in real-time.
- **Keyboard Presentation Controls (`DemoGuideModal.tsx`)**: Added global keyboard shortcuts (`1`–`7` for Acts 1–7, Arrow keys for navigation, Esc to close) with input focus guardrails.
- **Interactive Audit Ledger (`AuditLedgerViewer.tsx`)**: Made all ledger block hashes clickable to launch the inspector modal, and added a dynamic ledger integrity status badge.
- **Verification Suite**: 30/30 backend unit tests passing (`pytest`); `npm run build` Vite production build passing with 0 errors.

## [v0.5.0] - 2026-08-29
### Added
- **Interactive Judge Demo Walkthrough Guide**: Created `DemoGuideModal.tsx` providing a 7-Act interactive walkthrough wizard for live hackathon presentations.
- **Header Command Bar & Status Badges**: Integrated `🎯 Demo Guide` action button, quick simulation action buttons, and `🛡️ SHA-256 LEDGER ACTIVE` status badge in `Layout.tsx`.
- **Global State Synchronization & Resilient Reset**: Updated `IncidentsPage.tsx` with graceful fallback handling to ensure zero UI desynchronization or broken state on simulation reset.
- **Verification Suite**: 30/30 backend unit tests passing (`pytest`); `npm run build` Vite production build passing cleanly in 609ms with 0 errors.

## [v0.4.0] - 2026-08-29
### Added
- **Cryptographic Decision Ledger**: Implemented `AuditLog` database model with SHA-256 hash chaining (`previous_hash` -> `current_hash`) and integrity verification in `audit_service.py`.
- **AI Explainability & RAG Citation Engine**: Implemented `get_explainability_report()` surfacing feature attributions, confidence scores, and SOP markdown citations.
- **Time-Travel Incident Replay**: Built `replay_service.py` assembling synchronized temporal telemetry streams and audit event sequences.
- **Audit & Replay API Surface**: Exposed `/api/incidents/{id}/audit-trail`, `/api/incidents/{id}/audit-trail/verify`, `/api/incidents/{id}/explainability`, and `/api/incidents/{id}/replay`.
- **Frontend Command Center UI**: Created `AuditLedgerViewer.tsx`, `ExplainabilityMap.tsx`, and `ReplayPlayer.tsx` integrated via sub-navigation tabs in `IncidentsPage.tsx`.
- **Verification Suite**: Added `backend/tests/test_audit_replay.py`; 30/30 pytest tests passing; Vite production build (`npm run build`) passing with 0 errors.

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
