import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Camera, Wifi, MapPin, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { camerasAPI } from "../services/adminService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AddCameraProps {
  users: User[];
  onBack: () => void;
  onSave: (camera: {
    name: string;
    ipAddress: string;
    location: string;
    userId: string;
    status: "Online" | "Offline";
  }) => void;
}

export default function AddCamera({ users, onBack, onSave }: AddCameraProps) {
  const [formData, setFormData] = useState({
    name: "",
    ipAddress: "",
    location: "",
    userId: "",
    status: "Offline" as "Online" | "Offline",
  });

  const [errors, setErrors] = useState({
    name: "",
    ipAddress: "",
    location: "",
    userId: "",
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<"success" | "error" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {
      name: "",
      ipAddress: "",
      location: "",
      userId: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "Camera name is required";
    }

    if (!formData.ipAddress.trim()) {
      newErrors.ipAddress = "IP address is required";
    } else if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(formData.ipAddress)) {
      newErrors.ipAddress = "Invalid IP address format (e.g., 192.168.1.100)";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    if (!formData.userId) {
      newErrors.userId = "Please select a user";
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.ipAddress && !newErrors.location && !newErrors.userId;
  };

  const handleTestConnection = () => {
    if (!formData.ipAddress.trim()) {
      setErrors({ ...errors, ipAddress: "Enter IP address first" });
      return;
    }

    setTestingConnection(true);
    setConnectionResult(null);

    // Simulate connection test
    setTimeout(() => {
      const success = Math.random() > 0.3;
      setConnectionResult(success ? "success" : "error");
      if (success) {
        setFormData({ ...formData, status: "Online" });
      }
      setTestingConnection(false);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      let token = localStorage.getItem("token");
      
      // Admin bypass if no token
      if (!token) {
        token = "admin_bypass";
      }

      const cameraData = {
        branch: formData.name,
        ip_address: formData.ipAddress,
        location: formData.location,
        status: formData.status === "Online" ? "active" : "inactive",
        user_id: formData.userId,
      };
      
      console.log("📤 Creating camera with data:", cameraData);
      const result = await camerasAPI.create(cameraData, token);
      console.log("✅ Camera created:", result);

      alert("Camera added successfully!");
      onSave(formData);
    } catch (error: any) {
      console.error("❌ Failed to create camera:", error);
      alert(error.message || "Failed to add camera. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUser = users.find((u) => u.id === formData.userId);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add New Camera</h1>
            <p className="text-slate-600 mt-1">Configure a new camera for the KitchenEye system</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Selection */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Assign to User <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.userId}
                onValueChange={(value: string) => setFormData({ ...formData, userId: value })}
              >
                <SelectTrigger className={errors.userId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-slate-500">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && <p className="text-sm text-red-500 mt-1">{errors.userId}</p>}
              {selectedUser && (
                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-blue-800">
                    Camera will be assigned to <strong>{selectedUser.name}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Camera Name */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Camera Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., Main Kitchen Camera"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* IP Address */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                IP Address <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="192.168.1.100"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  className={errors.ipAddress ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testingConnection || !formData.ipAddress}
                  className="whitespace-nowrap"
                >
                  {testingConnection ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4 mr-2" />
                      Test
                    </>
                  )}
                </Button>
              </div>
              {errors.ipAddress && <p className="text-sm text-red-500 mt-1">{errors.ipAddress}</p>}
              {connectionResult && (
                <div className={`mt-2 p-3 rounded-lg flex items-center gap-2 ${
                  connectionResult === "success" 
                    ? "bg-green-50 border border-green-200" 
                    : "bg-red-50 border border-red-200"
                }`}>
                  {connectionResult === "success" ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800 font-medium">
                        Connection successful! Camera is online.
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-red-800 font-medium">
                        Connection failed. Please check IP address and network.
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., Kitchen - Zone A"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={errors.location ? "border-red-500" : ""}
              />
              {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location}</p>}
            </div>

            {/* Status Display */}
            <div>
              <label className="text-sm font-medium mb-2 block">Current Status</label>
              <Badge
                className={
                  formData.status === "Online"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }
              >
                {formData.status === "Online" ? (
                  <Wifi className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                {formData.status}
              </Badge>
              <p className="text-xs text-slate-500 mt-1">
                Status will be automatically determined by connection test
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1" disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Camera"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
