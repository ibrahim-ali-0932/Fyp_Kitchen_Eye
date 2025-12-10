import { API_URL } from "./api";

export type ViolationRecord = {
  id: string;
  violation_type: string;
  camera_location: string;
  destination_email?: string;
  timestamp: string;
  is_test?: boolean;
  sent_via?: string;
};

export async function fetchUserViolations(
  token: string
): Promise<ViolationRecord[]> {
  const response = await fetch(`${API_URL}/violations/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch violations");
  }

  return response.json();
}

export async function logViolation(params: {
  violation_type: string;
  camera_location: string;
  destination_email?: string;
  token: string;
  is_test?: boolean;
}): Promise<void> {
  const { violation_type, camera_location, destination_email, token, is_test } =
    params;

  const response = await fetch(`${API_URL}/violations/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      violation_type,
      camera_location,
      destination_email,
      is_test: is_test ?? true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to log violation");
  }
}
