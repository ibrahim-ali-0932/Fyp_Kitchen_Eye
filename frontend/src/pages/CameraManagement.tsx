import { useState } from "react";
import { Plus, Settings, Trash2, Camera, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import type { CameraInfo } from "./AdminPanel";

interface CameraManagementProps {
  cameras: CameraInfo[];
  userId: string;
  onAddCamera: (camera: Omit<CameraInfo, "id" | "thumbnail">) => void;
  onUpdateCamera: (cameraId: string, updates: Partial<CameraInfo>) => void;
  onDeleteCamera: (cameraId: string) => void;
}

export function CameraManagement({
  cameras,
  userId,
  onAddCamera,
  onUpdateCamera,
  onDeleteCamera,
}: CameraManagementProps) {
  const [isAddCameraOpen, setIsAddCameraOpen] = useState(false);
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<CameraInfo | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<"success" | "error" | null>(null);
  
  const [newCamera, setNewCamera] = useState({
    name: "",
    ipAddress: "",
    location: "",
    status: "Offline" as CameraInfo["status"],
    userId: userId,
  });

  const [editedCamera, setEditedCamera] = useState({
    name: "",
    ipAddress: "",
    location: "",
    status: "Offline" as CameraInfo["status"],
  });

  const handleAddCamera = () => {
    if (newCamera.name && newCamera.ipAddress && newCamera.location) {
      onAddCamera(newCamera);
      setNewCamera({
        name: "",
        ipAddress: "",
        location: "",
        status: "Offline",
        userId: userId,
      });
      setIsAddCameraOpen(false);
      setConnectionTestResult(null);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    
    // Simulate connection test
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Random success/failure for demo
    const isSuccess = Math.random() > 0.3;
    setConnectionTestResult(isSuccess ? "success" : "error");
    setIsTestingConnection(false);
    
    if (isSuccess && isAddCameraOpen) {
      setNewCamera({ ...newCamera, status: "Online" });
    }
  };

  const handleConfigure = (camera: CameraInfo) => {
    setSelectedCamera(camera);
    setEditedCamera({
      name: camera.name,
      ipAddress: camera.ipAddress,
      location: camera.location,
      status: camera.status,
    });
    setIsConfigureOpen(true);
    setConnectionTestResult(null);
  };

  const handleSaveConfiguration = () => {
    if (selectedCamera) {
      onUpdateCamera(selectedCamera.id, editedCamera);
      setIsConfigureOpen(false);
      setSelectedCamera(null);
      setConnectionTestResult(null);
    }
  };

  const handleDeleteCamera = () => {
    if (selectedCamera) {
      onDeleteCamera(selectedCamera.id);
      setIsDeleteDialogOpen(false);
      setSelectedCamera(null);
    }
  };

  const openDeleteDialog = (camera: CameraInfo) => {
    setSelectedCamera(camera);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Camera Management</CardTitle>
            <Button
              size="sm"
              onClick={() => setIsAddCameraOpen(true)}
              className="bg-gradient-to-r from-[#155dfc] to-[#9810fa] hover:opacity-90"
            >
              <Plus className="size-4" />
              Add Camera
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cameras.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="size-12 text-[#90a1b9] mx-auto mb-3" />
              <p className="text-[#90a1b9]">No cameras added yet</p>
              <p className="text-sm text-[#90a1b9] mt-1">Click "Add Camera" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cameras.map((camera) => (
                <div
                  key={camera.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="size-16 rounded-lg bg-gradient-to-br from-[#155dfc]/20 to-[#9810fa]/20 flex items-center justify-center shrink-0">
                      <Camera className="size-8 text-[#8ec5ff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-white">{camera.name}</h4>
                        <Badge
                          variant={camera.status === "Online" ? "default" : "secondary"}
                          className={
                            camera.status === "Online"
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                              : "bg-gray-500/20 border-gray-500/50 text-gray-400"
                          }
                        >
                          {camera.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 mb-3">
                        <p className="text-sm text-[#90a1b9]">
                          IP: <span className="text-white">{camera.ipAddress}</span>
                        </p>
                        <p className="text-sm text-[#90a1b9]">
                          Location: <span className="text-white">{camera.location}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConfigure(camera)}
                          className="bg-transparent border-white/20 text-white hover:bg-white/10"
                        >
                          <Settings className="size-3.5" />
                          Configure
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteDialog(camera)}
                        >
                          <Trash2 className="size-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Camera Dialog */}
      <Dialog open={isAddCameraOpen} onOpenChange={setIsAddCameraOpen}>
        <DialogContent className="bg-[#1a1f3a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add New Camera</DialogTitle>
            <DialogDescription className="text-[#90a1b9]">
              Configure a new camera for monitoring.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#90a1b9] mb-1.5 block">Camera Name</label>
              <Input
                placeholder="e.g., Main Kitchen Camera"
                value={newCamera.name}
                onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
              />
            </div>
            <div>
              <label className="text-sm text-[#90a1b9] mb-1.5 block">IP Address</label>
              <Input
                placeholder="e.g., 192.168.1.100"
                value={newCamera.ipAddress}
                onChange={(e) => setNewCamera({ ...newCamera, ipAddress: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
              />
            </div>
            <div>
              <label className="text-sm text-[#90a1b9] mb-1.5 block">Location</label>
              <Input
                placeholder="e.g., Main Kitchen - Zone A"
                value={newCamera.location}
                onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
              />
            </div>
            <div>
              <Button
                onClick={handleTestConnection}
                disabled={isTestingConnection || !newCamera.ipAddress}
                className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20"
                variant="outline"
              >
                {isTestingConnection ? "Testing Connection..." : "Test Connection"}
              </Button>
              {connectionTestResult === "success" && (
                <div className="flex items-center gap-2 mt-2 text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  <p className="text-sm">Connection successful!</p>
                </div>
              )}
              {connectionTestResult === "error" && (
                <div className="flex items-center gap-2 mt-2 text-red-400">
                  <XCircle className="size-4" />
                  <p className="text-sm">Connection failed. Please check the IP address.</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddCameraOpen(false);
                setConnectionTestResult(null);
              }}
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCamera}
              className="bg-gradient-to-r from-[#155dfc] to-[#9810fa] hover:opacity-90"
            >
              Save Camera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Camera Dialog */}
      <Dialog open={isConfigureOpen} onOpenChange={setIsConfigureOpen}>
        <DialogContent className="bg-[#1a1f3a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Configure Camera</DialogTitle>
            <DialogDescription className="text-[#90a1b9]">
              Update camera settings and test connection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#90a1b9] mb-1.5 block">Camera Name</label>
              <Input
                placeholder="e.g., Main Kitchen Camera"
                value={editedCamera.name}
                onChange={(e) => setEditedCamera({ ...editedCamera, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
              />
            </div>
            <div>
              <label className="text-sm text-[#90a1b9] mb-1.5 block">IP Address</label>
              <Input
                placeholder="e.g., 192.168.1.100"
                value={editedCamera.ipAddress}
                onChange={(e) => setEditedCamera({ ...editedCamera, ipAddress: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
              />
            </div>
            <div>
              <label className="text-sm text-[#90a1b9] mb-1.5 block">Location</label>
              <Input
                placeholder="e.g., Main Kitchen - Zone A"
                value={editedCamera.location}
                onChange={(e) => setEditedCamera({ ...editedCamera, location: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-[#90a1b9]"
              />
            </div>
            <div>
              <Button
                onClick={handleTestConnection}
                disabled={isTestingConnection || !editedCamera.ipAddress}
                className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20"
                variant="outline"
              >
                {isTestingConnection ? "Testing Connection..." : "Test Connection"}
              </Button>
              {connectionTestResult === "success" && (
                <div className="flex items-center gap-2 mt-2 text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  <p className="text-sm">Connection successful!</p>
                </div>
              )}
              {connectionTestResult === "error" && (
                <div className="flex items-center gap-2 mt-2 text-red-400">
                  <XCircle className="size-4" />
                  <p className="text-sm">Connection failed. Please check the IP address.</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfigureOpen(false);
                setConnectionTestResult(null);
              }}
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveConfiguration}
              className="bg-gradient-to-r from-[#155dfc] to-[#9810fa] hover:opacity-90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Camera Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1a1f3a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Remove Camera</DialogTitle>
            <DialogDescription className="text-[#90a1b9]">
              Are you sure you want to remove {selectedCamera?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCamera}
            >
              Remove Camera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
