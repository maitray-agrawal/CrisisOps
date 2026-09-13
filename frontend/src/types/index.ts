export interface Machine {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'CONTAINED';
  description?: string;
  created_at: string;
}

export interface TelemetryRecord {
  id: number;
  machine_id: string;
  timestamp: string;
  vibration_mm_s: number;
  temp_celsius: number;
  output_units_min: number;
  is_anomaly: boolean;
}

export interface MaintenanceRecord {
  id: string;
  machine_id: string;
  timestamp: string;
  component: string;
  action_taken: string;
  technician: string;
  notes: string;
}

export interface Evidence {
  id: string;
  incident_id: string;
  title: string;
  description: string;
  source_type: string;
  confidence_score: number;
  created_at: string;
}

export interface ActionRecommendation {
  id: string;
  incident_id: string;
  sop_id?: string;
  action_title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  human_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  simulation_executed: boolean;
  executed_at?: string;
}

export interface Incident {
  id: string;
  machine_id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'PENDING_APPROVAL' | 'APPROVED' | 'CONTAINED' | 'RESOLVED';
  summary?: string;
  created_at: string;
  resolved_at?: string;
  evidence_items?: Evidence[];
  action_recommendations?: ActionRecommendation[];
}

export interface SOPDocument {
  id: string;
  sop_code: string;
  title: string;
  target_component: string;
  content_markdown: string;
  created_at: string;
}

export interface MachineDetail extends Machine {
  recent_telemetry: TelemetryRecord[];
  maintenance_records: MaintenanceRecord[];
  active_incidents: Incident[];
}

export interface HealthStatus {
  status: string;
  app: string;
  version: string;
  environment: string;
}

export interface SignalAnalysis {
  signal_summary: string;
  primary_anomaly: string;
  severity_score: number;
  variance_pct: number;
  anomalous_signals: string[];
  used_fallback: boolean;
}

export interface RootCauseAnalysis {
  hypothesis: string;
  confidence_score: number;
  evidence_items: string[];
  contributing_factors: string[];
  correlated_maintenance_id?: string;
  used_fallback: boolean;
}

export interface ImpactAssessment {
  estimated_downtime_hours: number;
  estimated_financial_loss_usd: number;
  safety_risk_rating: string;
  summary: string;
  production_capacity_loss_pct: number;
  used_fallback: boolean;
}

export interface ActionStep {
  step_number: number;
  title: string;
  description: string;
  is_automated_simulated: boolean;
}

export interface ActionPlan {
  sop_id: string;
  sop_code: string;
  sop_title: string;
  action_title: string;
  action_summary: string;
  recommended_steps: ActionStep[];
  requires_human_approval: boolean;
  priority: string;
  used_fallback: boolean;
}

export interface IterationTrace {
  iteration: number;
  tool_name: string;
  tool_category: string;
  decision_rationale: string;
  observation_summary: string;
  result_summary: string;
  status: 'SUCCESS' | 'FAILED' | 'ADAPTED';
  confidence_score?: number;
  adaptation_note?: string;
  timestamp: string;
}

export interface GoalVerificationCriterion {
  metric: string;
  target: string;
  current: string;
  status: 'PASS' | 'FAIL';
}

export interface GoalVerification {
  goal_achieved: boolean;
  overall_status?: string;
  criteria: GoalVerificationCriterion[];
}

export interface InvestigationResult {
  incident_id: string;
  machine_id: string;
  signal_analysis: SignalAnalysis;
  root_cause_analysis: RootCauseAnalysis;
  impact_assessment: ImpactAssessment;
  action_plan: ActionPlan;
  retrieved_sop?: SOPDocument;
  pipeline_status: string;
  executed_at: string;
  goal?: string;
  agent_status?: string;
  agent_runtime_trace?: IterationTrace[];
  selected_tools?: string[];
  completed_tools?: string[];
  failed_actions?: Array<{ action: string; reason: string; iteration: number }>;
  adaptation_events?: Array<{ from_strategy: string; to_strategy: string; reason: string; iteration: number }>;
  confidence_score?: number;
  risk_level?: string;
  verification_results?: GoalVerification;
}

export interface AuditLogEntry {
  id: string;
  incident_id: string;
  timestamp: string;
  actor_type: string;
  actor_id: string;
  action_type: string;
  details_json: string;
  previous_hash: string;
  current_hash: string;
}

export interface AuditVerificationResponse {
  is_valid: boolean;
  total_entries: number;
  tampered_entry_id?: string;
  message: string;
}

export interface ExplainabilityReport {
  incident_id: string;
  machine_id: string;
  hypothesis: string;
  confidence_score: number;
  telemetry_features: Array<{ title: string; description: string; confidence: number }>;
  correlated_maintenance: Array<{ title: string; description: string; confidence: number }>;
  cited_sop?: {
    id: string;
    code: string;
    title: string;
    target_component: string;
    snippet: string;
  };
  fallback_used: boolean;
  reasoning_summary: string;
}

export interface ReplayStep {
  step_number: number;
  timestamp: string;
  vibration_mm_s: number;
  temp_celsius: number;
  output_units_min: number;
  machine_status: string;
  event_title?: string;
  event_type?: string;
  event_actor?: string;
  details?: Record<string, any>;
}

export interface ReplayTimeline {
  incident_id: string;
  machine_id: string;
  total_steps: number;
  steps: ReplayStep[];
}

