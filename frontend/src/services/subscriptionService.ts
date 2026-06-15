import { getAuthToken } from "./authToken";
import { API_URL } from "./api";

export interface SubscriptionDetails {
  plan: string;
  status: string;
  subscription_status?: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  next_billing_date?: string | null;
  cancel_at_period_end?: boolean;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  features?: string[];
}

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

export async function fetchCurrentSubscription(): Promise<SubscriptionDetails> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/subscriptions/current`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Subscription fetch failed: ${response.status}`);
  }

  return response.json();
}

export async function cancelSubscription(): Promise<SubscriptionDetails> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/subscriptions/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Cancellation request failed: ${response.status}`);
  }

  return response.json();
}