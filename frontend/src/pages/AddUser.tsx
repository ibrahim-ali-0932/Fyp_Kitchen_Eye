import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, User, Mail, Shield, Activity, Key } from "lucide-react";
import { usersAPI } from "../services/adminService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface AddUserProps {
  onBack: () => void;
  onSave: (user: {
    name: string;
    email: string;
    role: "Admin" | "Manager" | "Viewer";
    status: "Active" | "Inactive";
  }) => void;
}

export default function AddUser({ onBack, onSave }: AddUserProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Viewer" as "Admin" | "Manager" | "Viewer",
    status: "Active" as "Active" | "Inactive",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      password: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.email && !newErrors.password;
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

      console.log("Creating user...");
      await usersAPI.create(
        {
          email: formData.email,
          password: formData.password,
          fullName: formData.name,
          role: formData.role,
          status: formData.status,
        },
        token
      );

      alert("User created successfully!");
      onSave(formData);
    } catch (error: any) {
      console.error("Failed to create user:", error);
      alert(error.message || "Failed to create user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold">Add New User</h1>
            <p className="text-slate-600 mt-1">Create a new user account for the KitchenEye system</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Role Field */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.role}
                onValueChange={(value: "Admin" | "Manager" | "Viewer") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">Admin</Badge>
                      <span className="text-xs text-slate-500">Full system access</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Manager">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">Manager</Badge>
                      <span className="text-xs text-slate-500">Branch-level access</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Viewer">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200">Viewer</Badge>
                      <span className="text-xs text-slate-500">Read-only access</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Field */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Status <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.status}
                onValueChange={(value: "Active" | "Inactive") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">
                    <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                  </SelectItem>
                  <SelectItem value="Inactive">
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">Inactive</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role Permissions Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Role Permissions</h3>
              <div className="text-sm text-blue-800 space-y-1">
                {formData.role === "Admin" && (
                  <p>✓ Full system access including user management and settings</p>
                )}
                {formData.role === "Manager" && (
                  <p>✓ Branch-level access with report generation and analytics</p>
                )}
                {formData.role === "Viewer" && (
                  <p>✓ Read-only access to dashboards and reports</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1" disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
