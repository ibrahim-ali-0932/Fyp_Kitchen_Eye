// frontend/src/services/violationsService.ts
import { API_URL } from "./api";
import { authorizedFetch } from "./authToken";

export type ViolationRecord = {
  id: string;
  violation_id?: string;
  violation_type: string;
  camera_id?: string;
  camera_location?: string;
  violation_time?: string;
  timestamp?: string;
  confidence?: number;
  resolved?: boolean;
  snapshot_id?: string;
  snapshot_filename?: string;
  // legacy fields from frontend-logged violations
  email?: string;
  destination_email?: string;
  is_test?: boolean;
  sent_via?: string;
};

export type FetchUserViolationsParams = {
  branchId?: string;
  search?: string;
  category?: string;
  severity?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
};

export async function fetchUserViolations(params?: FetchUserViolationsParams): Promise<ViolationRecord[]> {
  const query = new URLSearchParams();
  if (params?.branchId && params.branchId !== "all") query.set("branch_id", params.branchId);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.category && params.category !== "all") query.set("category", params.category);
  if (params?.severity && params.severity !== "all") query.set("severity", params.severity);
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.startDate) query.set("start_date", params.startDate);
  if (params?.endDate) query.set("end_date", params.endDate);
  if (params?.startTime) query.set("start_time", params.startTime);
  if (params?.endTime) query.set("end_time", params.endTime);
  if (typeof params?.limit === "number") query.set("limit", String(params.limit));

  const suffix = query.toString();
  const url = suffix ? `${API_URL}/violations/user?${suffix}` : `${API_URL}/violations/user`;
  const res = await authorizedFetch(url);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Session expired or invalid. Please log in again.");
    }
    const err = await res.text();
    throw new Error(`Failed to fetch violations: ${res.status} - ${err}`);
  }
  return res.json();
}

export async function fetchTodayViolations(): Promise<ViolationRecord[]> {
  const res = await authorizedFetch(`${API_URL}/violations/today`);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Session expired or invalid. Please log in again.");
    }
    const err = await res.text();
    throw new Error(`Failed to fetch today's violations: ${res.status} - ${err}`);
  }
  return res.json();
}

export async function resetNotificationCount(): Promise<void> {
  const res = await authorizedFetch(`${API_URL}/violations/notifications/reset`, {
    method: "POST",
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Session expired or invalid. Please log in again.");
    }
    const err = await res.text();
    throw new Error(`Failed to reset notifications: ${res.status} - ${err}`);
  }
}

export async function fetchViolationImage(violationId: string): Promise<string | null> {
  console.log("[violationsService] fetching image for violationId:", violationId);
  const res = await authorizedFetch(`${API_URL}/violations/${violationId}/image`);

  console.log("[violationsService] image response status:", res.status, "ok:", res.ok);

  if (res.status === 404) {
    console.log("[violationsService] no snapshot found for violationId:", violationId);
    return null;
  }

  if (!res.ok) {
    const err = await res.text();
    console.error("[violationsService] image fetch failed:", violationId, err);
    throw new Error(`Failed to fetch violation image: ${res.status} - ${err}`);
  }

  const blob = await res.blob();
  console.log("[violationsService] image blob received for violationId:", violationId, "size:", blob.size);
  return URL.createObjectURL(blob);
}

export async function logViolation(params: {
  violation_type: string;
  camera_location: string;
  destination_email?: string;
  is_test?: boolean;
}): Promise<void> {
  const res = await authorizedFetch(`${API_URL}/violations/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...params,
      is_test: params.is_test ?? true,
    }),
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Session expired or invalid. Please log in again.");
    }
    const err = await res.text();
    throw new Error(err || "Failed to log violation");
  }
}
