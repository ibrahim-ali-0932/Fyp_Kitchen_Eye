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
