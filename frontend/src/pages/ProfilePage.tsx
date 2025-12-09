import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  User,
  Mail,
  Building2,
  MapPin,
  Edit2,
  Save,
  X,
  Camera,
} from "lucide-react";

interface UserProfile {
  email: string;
  Fullname: string;
  Branchname: string;
  address: string;
}

interface ProfilePageProps {
  onProfileUpdate?: () => void | Promise<void>;
}

export default function ProfilePage({ onProfileUpdate }: ProfilePageProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    Fullname: "",
    Branchname: "",
    email: "",
    address: "",
  });

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found");
          setLoading(false);
          return;
        }

        const response = await fetch("http://localhost:8000/auth/profile/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
          setFormData({
            Fullname: data.Fullname || "",
            Branchname: data.Branchname || "",
            email: data.email || "",
            address: data.address || "",
          });
        } else {
          setError("Failed to fetch profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found");
        setSaving(false);
        return;
      }

      // Note: Email cannot be changed, but we need to include it in the request body for the schema
      const requestBody = {
        email: formData.email, // Include email (will be ignored by backend, uses token email)
        Fullname: formData.Fullname,
        Branchname: formData.Branchname,
        address: formData.address,
      };
      
      console.log("🔵 Sending profile update:", requestBody);
      
      const response = await fetch("http://localhost:8000/auth/profile/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log("🔵 Update response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Profile updated successfully:", data);
        setUserProfile(data);
        setFormData({
          Fullname: data.Fullname || "",
          Branchname: data.Branchname || "",
          email: data.email || "",
          address: data.address || "",
        });
        setIsEditing(false);
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
        
        // Notify parent component (DashboardLayout) to refresh its profile data
        if (onProfileUpdate) {
          console.log("🔄 Calling onProfileUpdate to refresh sidebar...");
          onProfileUpdate();
          console.log("✅ Sidebar refresh triggered");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        Fullname: userProfile.Fullname || "",
        Branchname: userProfile.Branchname || "",
        email: userProfile.email || "",
        address: userProfile.address || "",
      });
    }
    setIsEditing(false);
    setError("");
  };

  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !userProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${
                    userProfile?.Fullname || "User"
                  }`}
                />
                <AvatarFallback className="text-2xl bg-white text-blue-600">
                  {getUserInitials(userProfile?.Fullname || "User")}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <button
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full border-2 border-white hover:bg-blue-700 transition-colors"
                  title="Change avatar"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1 text-white">
              <h1 className="text-3xl font-bold mb-2">
                {isEditing ? (
                  <Input
                    value={formData.Fullname}
                    onChange={(e) =>
                      handleInputChange("Fullname", e.target.value)
                    }
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30"
                    placeholder="Full Name"
                  />
                ) : (
                  userProfile?.Fullname || "User"
                )}
              </h1>
              <p className="text-blue-100 text-lg">
                {userProfile?.email || "No email"}
              </p>
            </div>
            <div>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-white text-blue-600 hover:bg-blue-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={saving}
                    variant="outline"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.Fullname}
                      onChange={(e) =>
                        handleInputChange("Fullname", e.target.value)
                      }
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      {userProfile?.Fullname || "Not set"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                    {userProfile?.email || "Not set"}
                  </div>
                  <p className="text-xs text-slate-500">
                    Email cannot be changed
                  </p>
                </div>
              </div>
            </div>

            {/* Organization Information */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Organization Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700">
                    <Building2 className="w-4 h-4" />
                    Branch/Organization Name
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.Branchname}
                      onChange={(e) =>
                        handleInputChange("Branchname", e.target.value)
                      }
                      placeholder="Enter organization name"
                    />
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      {userProfile?.Branchname || "Not set"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-4 h-4" />
                    Address
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      placeholder="Enter your address"
                    />
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      {userProfile?.address || "Not set"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
