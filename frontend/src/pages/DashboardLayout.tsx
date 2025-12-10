import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  LayoutDashboard,
  History,
  Camera,
  TrendingUp,
  FileText,
  Bell,
  Users,
  CreditCard,
  LogOut,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Dashboard from "./Dashboard";
import ViolationHistory from "./ViolationHistory";
import LiveCameraFeed from "./LiveCameraFeed";
import Analytics from "./Analytics";
import Reports from "./Reports";
import NotificationSettings from "./NotificationSettings";
import ProfilePage from "./ProfilePage";
import Subscription from "./Subscription";

interface DashboardLayoutProps {
  onLogout: () => void;
}

type Page =
  | "dashboard"
  | "violations"
  | "cameras"
  | "analytics"
  | "reports"
  | "notifications"
  | "subscription"
  | "profile";

interface UserProfile {
  email: string;
  Fullname: string;
  Branchname: string;
  address: string;
}

export default function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user profile (can be called from anywhere)
  const fetchUserProfile = async () => {
    try {
      setLoading(true); // Set loading to true at start
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ No token found in localStorage");
        setLoading(false);
        setUserProfile({
          email: "No email",
          Fullname: "User",
          Branchname: "",
          address: "",
        });
        return;
      }

      console.log("🔵 ===== FETCHING PROFILE =====");
      console.log("🔵 Token exists:", !!token);
      console.log("🔵 Token (first 30 chars):", token.substring(0, 30) + "...");
      console.log("🔵 Making request to: http://localhost:8000/auth/profile/");

      const response = await fetch("http://localhost:8000/auth/profile/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("🔵 Response received!");
      console.log("🔵 Response status:", response.status);
      console.log("🔵 Response ok:", response.ok);
      console.log(
        "🔵 Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ ===== PROFILE DATA RECEIVED =====");
        console.log("✅ Raw data:", JSON.stringify(data, null, 2));
        console.log("✅ Data type:", typeof data);
        console.log("✅ Is array:", Array.isArray(data));
        console.log("✅ All keys:", Object.keys(data));
        console.log(
          "✅ Email value:",
          data.email,
          "(type:",
          typeof data.email,
          ")"
        );
        console.log(
          "✅ Fullname value:",
          data.Fullname,
          "(type:",
          typeof data.Fullname,
          ")"
        );
        console.log(
          "✅ Branchname value:",
          data.Branchname,
          "(type:",
          typeof data.Branchname,
          ")"
        );
        console.log(
          "✅ Address value:",
          data.address,
          "(type:",
          typeof data.address,
          ")"
        );

        // Check if data has actual values
        const hasEmail = data.email && data.email.trim() !== "";
        const hasFullname = data.Fullname && data.Fullname.trim() !== "";

        console.log("✅ Has email:", hasEmail);
        console.log("✅ Has fullname:", hasFullname);

        // Always set the profile data, even if some fields are empty
        const profileData = {
          email: data.email || "No email",
          Fullname: data.Fullname || "",
          Branchname: data.Branchname || "",
          address: data.address || "",
        };

        console.log("✅ Setting profile data:", profileData);
        setUserProfile(profileData);
        console.log("✅ Profile state updated");
      } else {
        const errorText = await response.text();
        console.error("❌ ===== PROFILE FETCH FAILED =====");
        console.error("❌ Status:", response.status);
        console.error("❌ Status text:", response.statusText);
        console.error("❌ Response text:", errorText);

        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
          console.error("❌ Error data:", errorData);
        } catch (e) {
          console.error("❌ Could not parse error as JSON");
        }

        // If token is invalid, clear it
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          console.log(
            "❌ Invalid/Unauthorized token, cleared from localStorage"
          );
        }

        // If profile not found (404), set default values
        if (response.status === 404) {
          console.warn("⚠️ Profile not found in database (404)");
        }

        // Set default values on any error
        setUserProfile({
          email: "No email",
          Fullname: "User",
          Branchname: "",
          address: "",
        });
      }
    } catch (error) {
      console.error("❌ ===== EXCEPTION IN FETCH PROFILE =====");
      if (error instanceof Error) {
        console.error("❌ Error type:", error.constructor.name);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error stack:", error.stack);
      }
      console.error("❌ Full error:", error);

      // Set default values on exception
      setUserProfile({
        email: "No email",
        Fullname: "User",
        Branchname: "",
        address: "",
      });
    } finally {
      console.log("🔵 Setting loading to false");
      setLoading(false);
      console.log("🔵 ===== FETCH PROFILE COMPLETE =====");
    }
  };

  // Fetch user profile on component mount
  useEffect(() => {
    console.log("🔵 DashboardLayout mounted - fetching profile");
    console.log("🔵 Token in localStorage:", !!localStorage.getItem("token"));
    fetchUserProfile();
  }, []);

  // Refresh profile when navigating away from profile page
  useEffect(() => {
    if (currentPage !== "profile") {
      console.log(
        "🔵 Page changed to:",
        currentPage,
        "- will refresh profile in 500ms"
      );
      // Small delay to ensure profile was saved if coming from profile page
      const timer = setTimeout(() => {
        console.log("🔵 Refreshing profile after page change");
        fetchUserProfile();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPage]);

  // Helper function to get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const menuItems = [
    { id: "dashboard" as Page, icon: LayoutDashboard, label: "Dashboard" },
    { id: "violations" as Page, icon: History, label: "Violation History" },
    { id: "cameras" as Page, icon: Camera, label: "Live Camera Feed" },
    { id: "analytics" as Page, icon: TrendingUp, label: "Analytics & Trends" },
    { id: "reports" as Page, icon: FileText, label: "Reports" },
    { id: "notifications" as Page, icon: Bell, label: "Notification Settings" },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "violations":
        return <ViolationHistory />;
      case "cameras":
        return <LiveCameraFeed />;
      case "analytics":
        return <Analytics />;
      case "reports":
        return <Reports />;
      case "notifications":
        return <NotificationSettings />;
      case "subscription":
        return <Subscription />;
      case "profile":
        return <ProfilePage onProfileUpdate={fetchUserProfile} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } bg-slate-900 text-white flex flex-col transition-all duration-300 hidden lg:flex`}
      >
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          {!sidebarCollapsed && (
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
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hover:bg-slate-800 text-white"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* User Profile */}
        <div
          className={`p-6 border-b border-slate-800 ${
            sidebarCollapsed ? "flex justify-center" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${
                  userProfile?.Fullname || "User"
                }`}
              />
              <AvatarFallback>
                {loading
                  ? "..."
                  : getUserInitials(userProfile?.Fullname || "User")}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate">
                  {loading ? "Loading..." : userProfile?.Fullname || "User"}
                </p>
                <p className="text-sm text-slate-400 truncate">
                  {loading ? "Loading..." : userProfile?.email || "No email"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                currentPage === item.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              } ${sidebarCollapsed ? "justify-center" : ""}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Subscription CTA */}
        <div className={`p-4 ${sidebarCollapsed ? "hidden" : ""}`}>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4">
            <p className="text-sm mb-3">Upgrade to Pro for advanced features</p>
            <Button
              size="sm"
              className="w-full bg-white text-blue-600 hover:bg-slate-100"
              onClick={() => setCurrentPage("subscription")}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex flex-col">
            <div className="p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="tracking-tight">KitchenEye</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSidebarOpen(false)}
                className="hover:bg-slate-800 text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${
                      userProfile?.Fullname || "User"
                    }`}
                  />
                  <AvatarFallback>
                    {loading
                      ? "..."
                      : getUserInitials(userProfile?.Fullname || "User")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate">
                    {loading ? "Loading..." : userProfile?.Fullname || "User"}
                  </p>
                  <p className="text-sm text-slate-400 truncate">
                    {loading ? "Loading..." : userProfile?.email || "No email"}
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4">
                <p className="text-sm mb-3">
                  Upgrade to Pro for advanced features
                </p>
                <Button
                  size="sm"
                  className="w-full bg-white text-blue-600 hover:bg-slate-100"
                  onClick={() => {
                    setCurrentPage("subscription");
                    setMobileSidebarOpen(false);
                  }}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search..." className="pl-9" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
              <button
                onClick={() => setCurrentPage("profile")}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Avatar className="cursor-pointer ring-2 ring-blue-500 ring-offset-2 hover:ring-blue-600 transition-all">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${
                      userProfile?.Fullname || "User"
                    }`}
                  />
                  <AvatarFallback>
                    {loading
                      ? "..."
                      : getUserInitials(userProfile?.Fullname || "User")}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{renderPage()}</main>
      </div>
    </div>
  );
}
