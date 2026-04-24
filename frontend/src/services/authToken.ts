import { auth } from "../firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

let cachedToken: string | null = localStorage.getItem("token");
let cachedTokenExpiryMs = 0;
let cachedTokenUid: string | null = localStorage.getItem("token_uid");
let inFlightTokenPromise: Promise<string> | null = null;

function decodeJwtExpMs(token: string): number {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return 0;
    }
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(normalized));
    const exp = Number(payload?.exp);
    return Number.isFinite(exp) ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}

function shouldReuseToken(token: string | null, expiryMs: number): token is string {
  if (!token || !expiryMs) {
    return false;
  }
  const safetyWindowMs = 60 * 1000;
  return Date.now() + safetyWindowMs < expiryMs;
}

function setCachedToken(token: string, uid: string) {
  cachedToken = token;
  cachedTokenExpiryMs = decodeJwtExpMs(token);
  cachedTokenUid = uid;
  localStorage.setItem("token", token);
  localStorage.setItem("token_uid", uid);
}

function clearCachedToken() {
  cachedToken = null;
  cachedTokenExpiryMs = 0;
  cachedTokenUid = null;
  localStorage.removeItem("token");
  localStorage.removeItem("token_uid");
}

async function waitForCurrentUser(): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(auth.currentUser);
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });
}

export async function getAuthToken(): Promise<string> {
  const user = await waitForCurrentUser();

  if (!user) {
    clearCachedToken();
    throw new Error("Not authenticated");
  }

  if (
    shouldReuseToken(cachedToken, cachedTokenExpiryMs) &&
    cachedTokenUid === user.uid
  ) {
    return cachedToken;
  }

  if (inFlightTokenPromise) {
    return inFlightTokenPromise;
  }

  inFlightTokenPromise = (async () => {
    const token = await user.getIdToken();
    setCachedToken(token, user.uid);
    return token;
  })();

  try {
    return await inFlightTokenPromise;
  } finally {
    inFlightTokenPromise = null;
  }
}

export async function authorizedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  let response = await fetch(input, { ...init, headers });

  if (response.status === 401 && auth.currentUser) {
    try {
      const firstDetail = await response.clone().text();
      console.error("Auth 401 (first attempt):", String(input), firstDetail);
    } catch {
      console.error("Auth 401 (first attempt):", String(input));
    }

    const refreshed = await auth.currentUser.getIdToken(true);
    setCachedToken(refreshed, auth.currentUser.uid);
    const retryHeaders = new Headers(init.headers || {});
    retryHeaders.set("Authorization", `Bearer ${refreshed}`);
    response = await fetch(input, { ...init, headers: retryHeaders });

    if (response.status === 401) {
      try {
        const retryDetail = await response.clone().text();
        console.error("Auth 401 (after refresh):", String(input), retryDetail);
      } catch {
        console.error("Auth 401 (after refresh):", String(input));
      }
    }
  }

  return response;
}
