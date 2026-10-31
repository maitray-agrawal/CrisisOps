# Industrial CrisisOps — Durable Project Memory

## Project Core Facts
- **Project Name**: Industrial CrisisOps
- **Workspace Path**: `d:\CrisisOps`
- **Application Type**: AI-Powered Industrial Incident Investigation Platform (Hackathon MVP)
- **Primary Persona**: Industrial Operations Engineer / Maintenance Supervisor

---

## Technical Stack Choices & Rationale
- **Backend Framework**: Python FastAPI
  - Rationale: High performance, async support, native Pydantic v2 data validation, simple REST route declaration.
- **Frontend Framework**: React 18 + TypeScript + Vite
  - Rationale: Instant HMR, strong typing, clean component abstraction for live crisis dashboard.
- **Database**: SQLite (`crisisops.db`)
  - Rationale: Zero configuration, zero external service dependency, fully portable file-based SQL store.
- **Agent Framework**: Custom Sequential Pipeline with OpenAI/Gemini/Anthropic API wrappers (or fallback LLM interface).
  - Rationale: Eliminates heavy framework overhead (LangChain/AutoGPT) and guarantees deterministic control.
- **SOP Retrieval**: Local In-Memory Keyword / TF-IDF Vector Search Engine.
  - Rationale: Instant execution, zero vector database setup, 100% deterministic ranking on synthetic markdown files.

---

## Machine M-204 Baseline Parameters & Thresholds
- **Machine ID**: `M-204`
- **Machine Name**: Main Hydraulic Drive & Bearing Assembly
- **Normal Telemetry Range**:
  - Vibration: `1.5` to `2.5 mm/s` (RMS)
  - Bearing Temp: `50°C` to `60°C`
  - Output Rate: `95` to `105 units/min`
- **Anomaly Detection Thresholds**:
  - Vibration Anomaly: `> 4.5 mm/s`
  - Temp Anomaly: `> 75°C`
- **Simulated Anomaly Trigger Values (Incident State)**:
  - Vibration Spike: `7.8 mm/s`
  - Bearing Temp Spike: `88°C`
  - Output Drop: `62 units/min`
- **Post-Containment Baseline Values**:
  - Vibration: `1.8 mm/s`
  - Temp: `52°C`
  - Output: `100 units/min`

---

## Standard Operating Procedure Catalog
- `SOP-M204-BEARING`: Hydraulic Drive Bearing Degradation & Replacement Procedure
- `SOP-COOLING-PUMP`: Secondary Auxiliary Coolant Pump Failure Procedure
- `SOP-POWER-GEN`: Generator Voltage Fluctuating Response Procedure

---

## Key Design Rationale
1. **Why Human Approval is Mandatory**: Industrial safety standards strictly prohibit AI from executing un-gated physical machine operations. The platform acts as an **investigative co-pilot**, not an autonomous controller.
2. **Why Sequential Agent Pipeline Over Multi-Agent Swarm**: Multi-agent swarms introduce non-deterministic loops, unpredictable token usage, and latency spikes unsuitable for live hackathon demos. Linear pipeline with Pydantic contracts yields 100% predictable execution.
