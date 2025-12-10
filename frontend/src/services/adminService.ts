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
  branch: string;
  ip_address: string;
  location: string;
  status: string;
  user_id?: string;
  starting_date?: string;
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
};

export const camerasAPI = {
  // Get all cameras
  async getAll(token: string): Promise<Camera[]> {
    const response = await fetch(`${API_BASE_URL}/auth/cameras/`, {
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
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.detail || "Failed to create camera");
      } catch {
        throw new Error(`Failed to create camera: ${response.status} ${response.statusText}`);
      }
    }

    const result = await response.json();
    console.log("✅ Camera created successfully:", result);
    return result;
  },
};
