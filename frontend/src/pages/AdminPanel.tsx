import { useState } from "react";
import { Search, Plus, ChevronRight, Trash2, Camera, Wifi, WifiOff } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import AddUser from "./AddUser";
import AddCamera from "./AddCamera";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Viewer";
  status: "Active" | "Inactive";
  lastActive: string;
  avatar: string;
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
    thumbnail: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=300&h=200&fit=crop",
    userId: "1",
  },
  {
    id: "c2",
    name: "Prep Station Camera",
    ipAddress: "192.168.1.102",
    location: "Prep Area - Zone B",
    status: "Online",
    thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=200&fit=crop",
    userId: "1",
  },
  {
    id: "c3",
    name: "Storage Room Camera",
    ipAddress: "192.168.1.103",
    location: "Storage Room",
    status: "Offline",
    thumbnail: "https://images.unsplash.com/photo-1586210579191-33b45e38fa8c?w=300&h=200&fit=crop",
    userId: "1",
  },
  {
    id: "c4",
    name: "Loading Dock Camera",
    ipAddress: "192.168.1.104",
    location: "Loading Dock",
    status: "Online",
    thumbnail: "https://images.unsplash.com/photo-1528193234925-09ab90c4c46e?w=300&h=200&fit=crop",
    userId: "2",
  },
  {
    id: "c5",
    name: "Dining Area Camera",
    ipAddress: "192.168.1.105",
    location: "Dining Area",
    status: "Online",
    thumbnail: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop",
    userId: "2",
  },
];

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [cameras, setCameras] = useState<CameraInfo[]>(mockCameras);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(users[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Page navigation
  const [currentView, setCurrentView] = useState<"main" | "addUser" | "addCamera">("main");

  // Delete dialogs
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleteCameraOpen, setIsDeleteCameraOpen] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState<string | null>(null);

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const userCameras = cameras.filter((c) => c.userId === selectedUserId);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveUser = (userData: { name: string; email: string; role: User["role"]; status: User["status"] }) => {
    const user: User = {
      ...userData,
      id: `user-${Date.now()}`,
      lastActive: "Just now",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
    };
    setUsers([...users, user]);
    setCurrentView("main");
  };

  const handleSaveCamera = (cameraData: { name: string; ipAddress: string; location: string; userId: string; status: CameraInfo["status"] }) => {
    const camera: CameraInfo = {
      ...cameraData,
      id: `cam-${Date.now()}`,
      thumbnail: "",
    };
    setCameras([...cameras, camera]);
    setCurrentView("main");
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      setUsers(users.filter((u) => u.id !== userToDelete));
      setCameras(cameras.filter((c) => c.userId !== userToDelete));
      if (selectedUserId === userToDelete) {
        setSelectedUserId(users[0]?.id || null);
      }
      setIsDeleteUserOpen(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteCamera = () => {
    if (cameraToDelete) {
      setCameras(cameras.filter((c) => c.id !== cameraToDelete));
      setIsDeleteCameraOpen(false);
      setCameraToDelete(null);
    }
  };

  // Render different views
  if (currentView === "addUser") {
    return <AddUser onBack={() => setCurrentView("main")} onSave={handleSaveUser} />;
  }

  if (currentView === "addCamera") {
    return <AddCamera users={users} onBack={() => setCurrentView("main")} onSave={handleSaveCamera} />;
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
                  <img src="../public/images/Kitcheneye_logo.png" alt="" />
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
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/30" onClick={() => setCurrentView("addUser")}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedUserId === user.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{user.name}</p>
                        <Badge variant={user.role === "Admin" ? "default" : "secondary"} className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={user.status === "Active" ? "default" : "secondary"} className="text-xs">
                          {user.status}
                        </Badge>
                        <span className="text-xs text-slate-500">{user.lastActive}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
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
                      onClick={() => {
                        setUserToDelete(selectedUser.id);
                        setIsDeleteUserOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete User
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
                    <AvatarFallback className="text-xl">{selectedUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}</AvatarFallback>
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
                          <Badge variant={selectedUser.role === "Admin" ? "default" : "secondary"}>
                            {selectedUser.role}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-slate-600">Status</label>
                        <div className="mt-1">
                          <Badge variant={selectedUser.status === "Active" ? "default" : "secondary"}>
                            {selectedUser.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-slate-600">Last Active</label>
                        <p className="text-sm font-medium mt-1">{selectedUser.lastActive}</p>
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
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/30" onClick={() => setCurrentView("addCamera")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Camera
                  </Button>
                </div>

                {userCameras.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600">No cameras connected to this user</p>
                    <p className="text-sm text-slate-500 mt-1">Click "Add Camera" to get started</p>
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
                                  variant={camera.status === "Online" ? "default" : "secondary"}
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
                              <p className="text-sm text-slate-600 mb-1">IP: {camera.ipAddress}</p>
                              <p className="text-sm text-slate-600">{camera.location}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setCameraToDelete(camera.id);
                              setIsDeleteCameraOpen(true);
                            }}
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

      {/* Delete User Alert Dialog */}
      <AlertDialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone. All cameras
              associated with this user will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Camera Alert Dialog */}
      <AlertDialog open={isDeleteCameraOpen} onOpenChange={setIsDeleteCameraOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Camera</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this camera? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCamera} className="bg-red-600 hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
