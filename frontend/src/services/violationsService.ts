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

export async function fetchUserViolations(): Promise<ViolationRecord[]> {
  const res = await authorizedFetch(`${API_URL}/violations/user`);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Session expired or invalid. Please log in again.");
    }
    const err = await res.text();
    throw new Error(`Failed to fetch violations: ${res.status} - ${err}`);
  }
  return res.json();
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
