import { authorizedFetch } from "./authToken";
import { API_URL } from "./api";

export interface Branch {
  id: string;
  name: string;
  address?: string;
}

export async function fetchBranches(): Promise<Branch[]> {
  const res = await authorizedFetch(`${API_URL}/branches/`);
  if (!res.ok) throw new Error("Failed to fetch branches");
  const data = await res.json();
  return data.branches ?? [];
}

export async function createBranch(name: string, address = ""): Promise<Branch> {
  const res = await authorizedFetch(`${API_URL}/branches/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, address }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to create branch");
  }
  return res.json();
}

export async function deleteBranch(branchId: string): Promise<void> {
  const res = await authorizedFetch(`${API_URL}/branches/${branchId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete branch");
}
