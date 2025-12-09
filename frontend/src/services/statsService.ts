// services/statsService.ts
// -------------------------
// Handles fetching text-based statistics from FastAPI backend.
// Every backend file returns JSON, this service parses it safely.

export interface StatItem {
  title: string;
  value: number | string;
  change?: string;
  trend?: string;
  icon?: any;
  color?: string;
  bgColor?: string;
}

export interface ViolationTrend {
  day: string;
  ppe: number;
  spill: number;
  pest: number;
  fire: number;
}

export interface RecentViolation {
  id: number;
  type: string;
  description: string;
  severity: string;
  location: string;
  timestamp: string;
  status: string;
  image: string;
}

const API_BASE = "http://localhost:8000"; // change in production

// Fetch any stat file like violations.txt, trend.txt, etc.
export async function fetchStats(filename: string) {
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const response = await fetch(`${API_BASE}/stats/${filename}?t=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      console.warn("File not found:", filename);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch stats:", err);
    return null;
  }
}
