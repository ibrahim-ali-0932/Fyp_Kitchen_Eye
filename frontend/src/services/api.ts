export const API_URL = "http://127.0.0.1:8000";

export function getVideoUrl(cameraId: string): string {
  return `${API_URL}/videos/${cameraId}.mp4`;
}

export async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Invalid credentials");
  }

  return response.json();
}

async function fetchDetectionState(
  path: string,
  token: string,
): Promise<{ enabled: boolean; updated_at?: string }> {
  const response = await fetch(`${API_URL}${path}`, {
    method: path.endsWith("/status") ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Failed to update detection state: ${response.status}`,
    );
  }

  return response.json();
}

export const detectionAPI = {
  getStatus(token: string) {
    return fetchDetectionState("/detection/status", token);
  },
  start(token: string) {
    return fetchDetectionState("/detection/start", token);
  },
  stop(token: string) {
    return fetchDetectionState("/detection/stop", token);
  },
};
