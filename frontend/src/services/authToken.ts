import { auth } from "../firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

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
    throw new Error("Not authenticated");
  }

  const token = await user.getIdToken(true);
  localStorage.setItem("token", token);
  return token;
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
    localStorage.setItem("token", refreshed);
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
