# Changelog — Industrial CrisisOps

All notable changes to this project will be documented in this file.

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
