import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  ChevronRight,
  Trash2,
  Camera,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import AddUser from "./AddUser";
import AddCamera from "./AddCamera";
import {
  usersAPI,
  camerasAPI,
  plansAPI,
  User as APIUser,
  Camera as APICamera,
} from "../services/adminService";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Viewer";
  status: "Active" | "Inactive";
  lastActive: string;
  avatar: string;
  plan?: string;
}

export interface CameraInfo {
  id: string;
  name: string;
  ipAddress: string;
  location: string;
  status: "Online" | "Offline";
  thumbnail: string;
  userId: string;
}

interface AdminPanelProps {
  onLogout?: () => void;
}

// Mock data
const mockUsers: User[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@kitcheneye.com",
    role: "Admin",
    status: "Active",
    lastActive: "2 hours ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael.chen@kitcheneye.com",
    role: "Manager",
    status: "Active",
    lastActive: "5 minutes ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.rodriguez@kitcheneye.com",
    role: "Viewer",
    status: "Active",
    lastActive: "1 day ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
  },
  {
    id: "4",
    name: "David Kim",
    email: "david.kim@kitcheneye.com",
    role: "Manager",
    status: "Inactive",
    lastActive: "3 days ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
  },
  {
    id: "5",
    name: "Jessica Martinez",
    email: "jessica.martinez@kitcheneye.com",
    role: "Viewer",
    status: "Active",
    lastActive: "30 minutes ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
  },
];

const mockCameras: CameraInfo[] = [
  {
    id: "c1",
    name: "Main Kitchen Camera",
    ipAddress: "192.168.1.101",
    location: "Main Kitchen - Zone A",
    status: "Online",
    thumbnail:
      "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=300&h=200&fit=crop",
    userId: "1",
  },
  {
    id: "c2",
    name: "Prep Station Camera",
    ipAddress: "192.168.1.102",
    location: "Prep Area - Zone B",
    status: "Online",
    thumbnail:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=200&fit=crop",
    userId: "1",
  },
  {
    id: "c3",
    name: "Storage Room Camera",
    ipAddress: "192.168.1.103",
    location: "Storage Room",
    status: "Offline",
    thumbnail:
      "https://images.unsplash.com/photo-1586210579191-33b45e38fa8c?w=300&h=200&fit=crop",
    userId: "1",
  },
  {
    id: "c4",
    name: "Loading Dock Camera",
    ipAddress: "192.168.1.104",
    location: "Loading Dock",
    status: "Online",
    thumbnail:
      "https://images.unsplash.com/photo-1528193234925-09ab90c4c46e?w=300&h=200&fit=crop",
    userId: "2",
  },
  {
    id: "c5",
    name: "Dining Area Camera",
    ipAddress: "192.168.1.105",
    location: "Dining Area",
    status: "Online",
    thumbnail:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop",
    userId: "2",
  },
];

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Array<{ id: string; name?: string }>>([]);
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Page navigation
  const [currentView, setCurrentView] = useState<
    "main" | "addUser" | "addCamera"
  >("main");

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    try {
      // Admin bypass - create a dummy token for admin operations
      let token = localStorage.getItem("token");

      if (!token) {
        console.warn("⚠️ No token found - using admin mode");
        // For admin, we'll try without authentication first
        token = "admin_bypass";
      }

      console.log("📡 Fetching users and cameras...");
      const [usersData, camerasData, plansData] = await Promise.all([
        usersAPI.getAll(token),
        camerasAPI.getAll(token),
        plansAPI.getAll(token),
      ]);

      console.log("📥 Received data:", {
        usersCount: usersData.length,
        camerasCount: camerasData.length,
      });

      // Transform API users to UI format
      const transformedUsers: User[] = usersData.map((user: APIUser) => ({
        id: user.id,
        name: user.fullName || user.email,
        email: user.email,
        role: (user.role as User["role"]) || "Viewer",
        status: (user.status as User["status"]) || "Active",
        lastActive: "Recently",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.fullName || user.email)}`,
        plan: (user as any).plan || "basic",
      }));

      // Transform API cameras to UI format
      const transformedCameras: CameraInfo[] = camerasData.map(
        (camera: APICamera) => ({
          id: camera.id,
          name: `${camera.branch} Camera`,
          ipAddress: camera.ip_address,
          location: camera.location,
          status: camera.status === "active" ? "Online" : "Offline",
          thumbnail:
            "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=300&h=200&fit=crop",
          userId: camera.user_id || "",
        }),
      );

      setUsers(transformedUsers);
      setPlans(plansData || []);
      setCameras(transformedCameras);
      if (transformedUsers.length > 0 && !selectedUserId) {
        setSelectedUserId(transformedUsers[0].id);
      }

      console.log("✅ Data loaded successfully:", {
        users: transformedUsers.length,
        cameras: transformedCameras.length,
      });
    } catch (error: any) {
      console.error("❌ Failed to load data:", error);
      // Show UI with empty data instead of blocking
      setUsers([]);
      setCameras([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const userCameras = cameras.filter((c) => c.userId === selectedUserId);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSaveUser = () => {
    // Reload data after adding user
    loadData();
    setCurrentView("main");
  };

  const handleSaveCamera = () => {
    // Reload data after adding camera
    loadData();
    setCurrentView("main");
  };

  const handleDeleteUser = async (userId: string) => {
    console.log("🗑️ DELETE USER - Starting deletion for user ID:", userId);

    try {
      let token = localStorage.getItem("token");
      if (!token) {
        console.log("⚠️ No token found, using admin_bypass");
        token = "admin_bypass";
      }

      console.log("📡 Calling delete API for user:", userId);
      await usersAPI.delete(userId, token);
      console.log("✅ User deleted successfully from database");

      // Update local state
      const associatedCameras = cameras.filter((c) => c.userId === userId);
      console.log("🔗 Associated cameras to remove:", associatedCameras.length);

      setUsers(users.filter((u) => u.id !== userId));
      setCameras(cameras.filter((c) => c.userId !== userId));

      if (selectedUserId === userId) {
        const remainingUsers = users.filter((u) => u.id !== userId);
        setSelectedUserId(remainingUsers[0]?.id || null);
        console.log("👤 Selected new user:", remainingUsers[0]?.id || "none");
      }

      console.log("✅ UI state updated successfully");
      alert("User deleted successfully");
    } catch (error: any) {
      console.error("❌ DELETE USER FAILED:", error);
      console.error("Error details:", error.message, error.response?.data);
      alert("Failed to delete user. Please try again.");
    }
  };

  const handleDeleteCamera = async (cameraId: string) => {
    console.log(
      "🗑️ DELETE CAMERA - Starting deletion for camera ID:",
      cameraId,
    );

    try {
      let token = localStorage.getItem("token");
      if (!token) {
        console.log("⚠️ No token found, using admin_bypass");
        token = "admin_bypass";
      }

      console.log("📡 Calling delete API for camera:", cameraId);
      await camerasAPI.delete(cameraId, token);
      console.log("✅ Camera deleted successfully from database");

      // Update local state
      setCameras(cameras.filter((c) => c.id !== cameraId));
      console.log("✅ UI state updated - camera removed from list");

      alert("Camera removed successfully");
    } catch (error: any) {
      console.error("❌ DELETE CAMERA FAILED:", error);
      console.error("Error details:", error.message, error.response?.data);
      alert("Failed to remove camera. Please try again.");
    }
  };

  const handlePlanChange = async (userId: string, newPlan: string) => {
    try {
      let token = localStorage.getItem("token") || "admin_bypass";
      await usersAPI.updatePlan(userId, newPlan, token);
      // refresh local data
      await loadData();
      alert("Plan updated successfully");
    } catch (err: any) {
      console.error("Failed to update plan", err);
      alert("Failed to update plan. See console for details.");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Render different views
  if (currentView === "addUser") {
    return (
      <AddUser onBack={() => setCurrentView("main")} onSave={handleSaveUser} />
    );
  }

  if (currentView === "addCamera") {
    return (
      <AddCamera
        users={users}
        onBack={() => setCurrentView("main")}
        onSave={handleSaveCamera}
      />
    );
  }

  // Main view
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 border-b sticky top-0 z-50 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-12 h-10 bg-gradient-to-br rounded-lg flex items-center justify-center">
                <img src="/images/Kitcheneye_logo.png" alt="" />
              </div>
              <span className="text-2xl text-white tracking-tight">
                Kitchen
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Eye
                </span>
              </span>
              <p className="text-white">Admin Panel</p>
            </div>
            <div className="flex gap-2">
              {onLogout && (
                <Button variant="outline" onClick={onLogout}>
                  Logout
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-89px)]">
        {/* LEFT SECTION - Users List */}
        <div className="w-[400px] border-r bg-white shadow-sm ">
          <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="p-4 border-b">
              <div className="relative ">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Add User Button */}
            <div className="p-4 border-b">
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/30"
                onClick={() => setCurrentView("addUser")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-500 mb-2">No users found</p>
                  <p className="text-sm text-slate-400">
                    Click "Add User" to create your first user
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition-colors ${
                      selectedUserId === user.id
                        ? "bg-blue-50 border-l-4 border-l-blue-600"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{user.name}</p>
                          <Badge
                            variant={
                              user.role === "Admin" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              user.status === "Active" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {user.status}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {user.lastActive}
                          </span>
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {(user.plan || "basic").toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SECTION - User Details + Camera Management */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {selectedUser ? (
            <div className="p-6 space-y-6">
              {/* User Details Card */}
              <Card className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-xl font-semibold">User Details</h2>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteUser(selectedUser.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete User
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="w-full h-full object-cover"
                    />
                    <AvatarFallback className="text-xl">
                      {selectedUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="text-sm text-slate-600">Name</label>
                      <p className="font-medium">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">Email</label>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <label className="text-sm text-slate-600">Role</label>
                        <div className="mt-1">
                          <Badge
                            variant={
                              selectedUser.role === "Admin"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {selectedUser.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="text-sm text-slate-600">Plan</label>
                        <div className="mt-1">
                          <select
                            value={selectedUser.plan || "basic"}
                            onChange={(e) =>
                              handlePlanChange(selectedUser.id, e.target.value)
                            }
                            className="border rounded px-2 py-1"
                          >
                            {plans.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name || p.id}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-slate-600">Status</label>
                        <div className="mt-1">
                          <Badge
                            variant={
                              selectedUser.status === "Active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {selectedUser.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-slate-600">
                          Last Active
                        </label>
                        <p className="text-sm font-medium mt-1">
                          {selectedUser.lastActive}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Camera Management Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">Camera Management</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Cameras connected to this user ({userCameras.length})
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/30"
                    onClick={() => setCurrentView("addCamera")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Camera
                  </Button>
                </div>

                {userCameras.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">
                      No cameras connected to this user
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Click "Add Camera" to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userCameras.map((camera) => (
                      <Card key={camera.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden relative">
                              {camera.thumbnail ? (
                                <img
                                  src={camera.thumbnail}
                                  alt={camera.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Camera className="w-8 h-8 text-slate-400" />
                                </div>
                              )}
                              {camera.status === "Online" && (
                                <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium">{camera.name}</h3>
                                <Badge
                                  variant={
                                    camera.status === "Online"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {camera.status === "Online" ? (
                                    <Wifi className="w-3 h-3 mr-1" />
                                  ) : (
                                    <WifiOff className="w-3 h-3 mr-1" />
                                  )}
                                  {camera.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mb-1">
                                IP: {camera.ipAddress}
                              </p>
                              <p className="text-sm text-slate-600">
                                {camera.location}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteCamera(camera.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500">Select a user to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
