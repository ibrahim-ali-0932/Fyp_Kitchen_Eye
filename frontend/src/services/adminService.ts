const API_BASE_URL = "http://localhost:8000";

export interface User {
  id: string;
  email: string;
  fullName: string;
  branchName?: string;
  address?: string;
  role?: string;
  status?: string;
}

export interface Camera {
  id: string;
  name?: string;
  branch: string;
  ip_address: string;
  location: string;
  status: string;
  image?: string;
  user_id?: string;
  starting_date?: string;
  source_type?: string;
  source_value?: string;
  stream_url?: string;
}

export interface PlanLimits {
  plan: string;
  max_branches: number;
  max_cameras: number;
  max_users: number;
}

export interface PlanOption {
  id: string;
  name?: string;
  max_branches?: number;
  max_cameras?: number;
  max_users?: number;
}

export const usersAPI = {
  // Get all users
  async getAll(token: string): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/auth/users/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }

    const data = await response.json();
    return data.users;
  },

  // Delete a user
  async delete(userId: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete user");
    }
  },

  // Create a new user
  async create(
    userData: {
      email: string;
      password: string;
      fullName: string;
      branchName?: string;
      address?: string;
      role?: string;
      status?: string;
    },
    token: string
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create user");
    }

    return response.json();
  },

  // Update a user's plan
  async updatePlan(userId: string, plan: string, token: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/plan`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ plan }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update plan");
    }

    return response.json();
  },
};

export const plansAPI = {
  async getAll(token: string): Promise<PlanOption[]> {
    const response = await fetch(`${API_BASE_URL}/auth/users/plans`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch plans");
    }

    const data = await response.json();
    return data.plans || [];
  },

  async getLimits(token: string): Promise<PlanLimits[]> {
    const response = await fetch(`${API_BASE_URL}/auth/users/plans/limits`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch plan limits");
    }

    const data = await response.json();
    return data.plans || [];
  },

  async updateLimits(
    planId: string,
    updates: { max_branches?: number; max_cameras?: number; max_users?: number },
    token: string,
  ): Promise<PlanLimits> {
    const response = await fetch(`${API_BASE_URL}/auth/users/plans/${planId}/limits`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update plan limits");
    }

    const data = await response.json();
    return data.plan;
  },
};

export const camerasAPI = {
  // Get all cameras
  async getAll(token: string, userId?: string, branchId?: string): Promise<Camera[]> {
    const url = new URL(`${API_BASE_URL}/auth/cameras/`);
    if (userId) {
      url.searchParams.set("user_id", userId);
    }
    if (branchId && branchId !== "all") {
      url.searchParams.set("branch_id", branchId);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch cameras");
    }

    const data = await response.json();
    return data.cameras;
  },

  // Delete a camera
  async delete(cameraId: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/cameras/${cameraId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete camera");
    }
  },

  // Create a new camera
  async create(
    cameraData: {
      branch: string;
      ip_address: string;
      location: string;
      status?: string;
      user_id?: string;
      source_type?: string;
      source_value?: string;
    },
    token: string
  ): Promise<any> {
    console.log("📤 Sending camera creation request:", cameraData);
    
    const response = await fetch(`${API_BASE_URL}/auth/cameras/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cameraData),
    });

    console.log("📡 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API error response:", errorText);
      let detail = "";
      try {
        detail = JSON.parse(errorText)?.detail || "";
      } catch {
        detail = "";
      }
      throw new Error(detail || `Failed to create camera: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✅ Camera created successfully:", result);
    return result;
  },

  async test(
    cameraData: {
      source_type: string;
      source_value: string;
    },
    token: string,
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/cameras/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cameraData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let detail = "";
      try {
        detail = JSON.parse(errorText)?.detail || "";
      } catch {
        detail = "";
      }
      throw new Error(detail || `Failed to test camera source: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },
};
