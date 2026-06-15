import { getAuthToken } from "./authToken";
import { API_URL } from "./api";

export async function createCheckoutSession(
  plan: string,
  userEmail: string,
): Promise<void> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/subscriptions/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan, user_email: userEmail }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Checkout session request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data?.url) {
    throw new Error("No checkout URL returned from server");
  }

  window.location.href = data.url;
}