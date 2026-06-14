// frontend/src/services/statsService.ts
import { getAuthToken } from "./authToken";
import { fetchViolationImage } from "./violationsService";

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";

async function authHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

export interface ViolationSummary {
  user_id: string;
  last_updated: string | null;
  notification_count: number;
  apron_count: number;
  gloves_count: number;
  hairnet_count: number;
  fire_count: number;
  total_count: number;
  hygiene_score: number;
  apron_change_pct: number;
  gloves_change_pct: number;
  hairnet_change_pct: number;
  fire_change_pct: number;
}

export interface ChartDay {
  date: string;
  apron: number;
  gloves: number;
  hairnet: number;
  fire: number;
}

export interface RecentViolation {
  id: string;
  type: string;
  description: string;
  violation_type: string;
  severity: "High" | "Medium" | "Low";
  location: string;
  timestamp: string;
  status: "Pending" | "Resolved";
  has_snapshot: boolean;
  snapshot_url: string | null;
}

export interface DashboardData {
  summary: ViolationSummary;
  chart: { user_id: string; days: ChartDay[] };
  recent_violations: RecentViolation[];
}

export async function fetchDashboard(days = 7): Promise<DashboardData> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/stats/dashboard?days=${days}`, { headers });
  if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`);
  const data = await res.json();
  return {
    summary: data.summary,
    chart: { user_id: data.summary.user_id, days: data.chart },
    recent_violations: data.recent_violations,
  };
}

export async function fetchSummary(): Promise<ViolationSummary> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/stats/summary`, { headers });
  if (!res.ok) throw new Error(`Summary fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchChart(days = 7): Promise<{ user_id: string; days: ChartDay[] }> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/stats/chart?days=${days}`, { headers });
  if (!res.ok) throw new Error(`Chart fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchSnapshotImage(violationId: string): Promise<string | null> {
  return fetchViolationImage(violationId);
}