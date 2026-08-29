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
  status: 'OPEN' | 'INVESTIGATING' | 'PENDING_APPROVAL' | 'CONTAINED' | 'RESOLVED';
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
