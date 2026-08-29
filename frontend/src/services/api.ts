/// <reference types="vite/client" />
import {
  HealthStatus,
  Machine,
  MachineDetail,
  TelemetryRecord,
  MaintenanceRecord,
  Incident,
  Evidence,
  ActionRecommendation,
  SOPDocument
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.detail) errorMessage = parsed.detail;
    } catch {
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export const apiService = {
  // Health
  async checkHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<HealthStatus>(res);
  },

  // Machines
  async getMachines(): Promise<Machine[]> {
    const res = await fetch(`${API_BASE}/machines`);
    return handleResponse<Machine[]>(res);
  },

  async getMachineDetail(id: string): Promise<MachineDetail> {
    const res = await fetch(`${API_BASE}/machines/${encodeURIComponent(id)}`);
    return handleResponse<MachineDetail>(res);
  },

  async getMachineTelemetry(id: string, limit = 50): Promise<TelemetryRecord[]> {
    const res = await fetch(`${API_BASE}/machines/${encodeURIComponent(id)}/telemetry?limit=${limit}`);
    return handleResponse<TelemetryRecord[]>(res);
  },

  async getMachineMaintenance(id: string): Promise<MaintenanceRecord[]> {
    const res = await fetch(`${API_BASE}/machines/${encodeURIComponent(id)}/maintenance`);
    return handleResponse<MaintenanceRecord[]>(res);
  },

  // Incidents
  async getIncidents(status?: string, severity?: string): Promise<Incident[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/incidents${queryString}`);
    return handleResponse<Incident[]>(res);
  },

  async getIncidentDetail(id: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(id)}`);
    return handleResponse<Incident>(res);
  },

  async getIncidentEvidence(id: string): Promise<Evidence[]> {
    const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(id)}/evidence`);
    return handleResponse<Evidence[]>(res);
  },

  async getIncidentActions(id: string): Promise<ActionRecommendation[]> {
    const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(id)}/actions`);
    return handleResponse<ActionRecommendation[]>(res);
  },

  // SOPs
  async getSOPs(): Promise<SOPDocument[]> {
    const res = await fetch(`${API_BASE}/sops`);
    return handleResponse<SOPDocument[]>(res);
  },

  async getSOPDetail(id: string): Promise<SOPDocument> {
    const res = await fetch(`${API_BASE}/sops/${encodeURIComponent(id)}`);
    return handleResponse<SOPDocument>(res);
  },

  // Simulation Controls
  async getSimulationStatus(): Promise<{ mode: string; step_count: number }> {
    const res = await fetch(`${API_BASE}/simulation/status`);
    return handleResponse(res);
  },

  async triggerSimulationTick(): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/tick`, { method: 'POST' });
    return handleResponse(res);
  },

  async triggerDegradation(): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/degrade-m204`, { method: 'POST' });
    return handleResponse(res);
  },

  async resetSimulation(): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
    return handleResponse(res);
  },

  // AI Agent Pipeline & Actuation
  async triggerInvestigation(incidentId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(incidentId)}/investigate`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async getInvestigation(incidentId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(incidentId)}/investigation`);
    return handleResponse(res);
  },

  async approvePlan(incidentId: string, operatorName = 'Lead Industrial Operator'): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(incidentId)}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator_name: operatorName })
    });
    return handleResponse(res);
  },

  async executeActuation(incidentId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(incidentId)}/execute-actuation`, {
      method: 'POST'
    });
    return handleResponse(res);
  }
};
