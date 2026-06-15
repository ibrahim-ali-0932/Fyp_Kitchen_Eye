import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  LayoutDashboard,
  History,
  Camera,
  TrendingUp,
  FileText,
  Bell,
  Lock,
  CreditCard,
  LogOut,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import Dashboard from "./Dashboard";
import ViolationHistory from "./ViolationHistory";
import LiveCameraFeed from "./LiveCameraFeed";
import Analytics from "./Analytics";
import Reports from "./Reports";
import NotificationSettings from "./NotificationSettings";
import BranchesPage from "./BranchesPage";
import ProfilePage from "./ProfilePage";
import Subscription from "./Subscription";
import NotificationBell from "../components/NotificationBell";
import { authorizedFetch } from "../services/authToken";
import { API_URL } from "../services/api";
import { auth } from "../firebase";
import { useLocation, useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  onLogout: () => void;
}

type Page =
  | "dashboard"
  | "violations"
  | "cameras"
  | "branches"
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
  plan?: string;
  role?: string;
  createdAt?: string;
  subscription_status?: string;
}

const TRIAL_DAYS = 7;
const TRIAL_ALLOWED_PAGES: Page[] = ["dashboard", "violations"];

const PAGE_TO_PATH: Record<Page, string> = {
  dashboard: "/dashboard",
  violations: "/dashboard/violations",
  cameras: "/dashboard/cameras",
  branches: "/dashboard/branches",
  analytics: "/dashboard/analytics",
  reports: "/dashboard/reports",
  notifications: "/dashboard/notifications",
  subscription: "/dashboard/subscription",
  profile: "/dashboard/profile",
};

const PATH_TO_PAGE: Record<string, Page> = {
  "": "dashboard",
  dashboard: "dashboard",
  violations: "violations",
  cameras: "cameras",
  branches: "branches",
  analytics: "analytics",
  reports: "reports",
  notifications: "notifications",
  subscription: "subscription",
  profile: "profile",
};

const parseDashboardPath = (
  pathname: string,
): { page: Page; known: boolean } => {
  const normalizedPath = pathname.replace(/\/+$/, "");
  const segments = normalizedPath.split("/").filter(Boolean);
  const pageKey = segments[1] || "";
  const page = PATH_TO_PAGE[pageKey];

  if (page) {
    return { page, known: true };
  }

  return { page: "dashboard", known: false };
};

export default function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<Page>(
    () => parseDashboardPath(location.pathname).page,
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const getEmailFallback = () => {
    return (
      userProfile?.email ||
      auth.currentUser?.email ||
      localStorage.getItem("user_email") ||
      "No email"
    );
  };

  const handlePageChange = (page: Page, closeMobileSidebar = false) => {
    const targetPath = PAGE_TO_PATH[page];
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
    setCurrentPage(page);
    if (closeMobileSidebar) {
      setMobileSidebarOpen(false);
    }
  };

  // Function to fetch user profile (can be called from anywhere)
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authorizedFetch(`${API_URL}/auth/profile/`, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        const profileData = {
          email:
            data.email ||
            auth.currentUser?.email ||
            localStorage.getItem("user_email") ||
            "No email",
          Fullname: data.Fullname || "",
          Branchname: data.Branchname || "",
          address: data.address || "",
          plan: data.plan || "basic",
          role: data.role || "",
          createdAt: data.createdAt || "",
          subscription_status: data.subscription_status || "",
        };
        setUserProfile(profileData);
      } else {
        // Keep session state managed by Firebase auth observer; do not force local signout here.

        // Set default values on any error
        setUserProfile({
          email:
            auth.currentUser?.email ||
            localStorage.getItem("user_email") ||
            "No email",
          Fullname: "User",
          Branchname: "",
          address: "",
          plan: "basic",
          role: "",
          createdAt: "",
          subscription_status: "",
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
        email:
          auth.currentUser?.email ||
          localStorage.getItem("user_email") ||
          "No email",
        Fullname: "User",
        Branchname: "",
        address: "",
        plan: "basic",
        role: "",
        createdAt: "",
        subscription_status: "",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const parsed = parseDashboardPath(location.pathname);

    if (!parsed.known && location.pathname.startsWith("/dashboard")) {
      navigate("/dashboard", { replace: true });
      setCurrentPage("dashboard");
      return;
    }

    setCurrentPage(parsed.page);
  }, [location.pathname, navigate]);

  // Helper function to get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const normalizedPlan = (userProfile?.plan || "basic").toLowerCase();
  const normalizedRole = (userProfile?.role || "").toLowerCase();
  const normalizedSubscriptionStatus = (userProfile?.subscription_status || "").toLowerCase();
  const isBasicPlan = normalizedPlan === "basic";
  const isAdminBypass =
    (userProfile?.role || "").toLowerCase() === "admin" ||
    localStorage.getItem("token") === "admin_bypass";
  const isProPlan = normalizedPlan.includes("pro") || normalizedPlan.includes("enterprise");
  const hasPaidSubscription =
    isProPlan ||
    (
      !isBasicPlan &&
      (
        normalizedSubscriptionStatus === "active" ||
        normalizedSubscriptionStatus === "paid" ||
        normalizedSubscriptionStatus === "trialing"
      )
    );

  const getTrialState = () => {
    const createdAtRaw = userProfile?.createdAt;
    if (!createdAtRaw || isProPlan || isAdminBypass) {
      return { active: false, daysLeft: 0 };
    }

    const createdAt = new Date(createdAtRaw);
    if (Number.isNaN(createdAt.getTime())) {
      return { active: false, daysLeft: 0 };
    }

    const trialEnd = new Date(
      createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
    );
    const now = new Date();
    const active = now < trialEnd;
    const daysLeft = active
      ? Math.max(
          1,
          Math.ceil(
            (trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
          ),
        )
      : 0;

    return { active, daysLeft };
  };

  const trialState = getTrialState();

  const canAccessPage = (page: Page) => {
    if (page === "branches") {
      return (
        isAdminBypass ||
        normalizedRole === "admin" ||
        normalizedRole === "owner" ||
        hasPaidSubscription
      );
    }

    if (isAdminBypass || isProPlan) {
      return true;
    }

    if (page === "dashboard" || page === "subscription" || page === "profile") {
      return true;
    }

    if (trialState.active && TRIAL_ALLOWED_PAGES.includes(page)) {
      return true;
    }

    return false;
  };

  const renderPlanCard = () => {
    const needsUpgrade = !hasPaidSubscription || isBasicPlan;

    if (!needsUpgrade) {
      return null;
    }

    return (
      <div className="rounded-xl p-4 bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-300/20 shadow-lg shadow-blue-950/20">
        <p className="text-sm mb-3 text-white/95">
          Upgrade to Pro for advanced features
        </p>
        <Button
          size="sm"
          className="w-full bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100"
          onClick={() => handlePageChange("subscription")}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Upgrade Plan
        </Button>
      </div>
    );
  };

  const menuItems = [
    { id: "dashboard" as Page, icon: LayoutDashboard, label: "Dashboard" },
    { id: "violations" as Page, icon: History, label: "Violation History" },
    { id: "cameras" as Page, icon: Camera, label: "Live Camera Feed" },
    { id: "branches" as Page, icon: Building2, label: "Branches" },
    { id: "analytics" as Page, icon: TrendingUp, label: "Analytics & Trends" },
    { id: "reports" as Page, icon: FileText, label: "Reports" },
    { id: "notifications" as Page, icon: Bell, label: "Notification" },
    { id: "subscription" as Page, icon: CreditCard, label: "Subscription" },
  ];

  const renderPage = () => {
    if (!canAccessPage(currentPage)) {
      return (
        <div className="p-6">
          <Card className="max-w-3xl mx-auto p-8 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-700" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl mb-2">Upgrade Required</h2>
                <p className="text-slate-600 mb-4">
                  This feature is available on the Pro plan.
                  {trialState.active
                    ? ` Your trial allows Dashboard and Violation History only (${trialState.daysLeft} day${trialState.daysLeft === 1 ? "" : "s"} left).`
                    : " Upgrade to Pro to unlock Live Feed, Analytics, Reports, and Notification settings."}
                </p>
                <div className="flex gap-3">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handlePageChange("subscription")}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange("dashboard")}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "violations":
        return <ViolationHistory />;
      case "cameras":
        return <LiveCameraFeed />;
      case "branches":
        return <BranchesPage />;
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
                <img src="/images/Kitcheneye_logo.png" alt="" />
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
                  {loading ? "Loading..." : getEmailFallback()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const locked = !canAccessPage(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="flex items-center gap-2">
                    {item.label}
                    {locked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Subscription CTA */}
        <div className={`p-4 ${sidebarCollapsed ? "hidden" : ""}`}>
          {renderPlanCard()}
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
                    {loading ? "Loading..." : getEmailFallback()}
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
              {menuItems.map((item) => {
                const locked = !canAccessPage(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handlePageChange(item.id, true)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      currentPage === item.id
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex items-center gap-2">
                      {item.label}
                      {locked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4">
              {renderPlanCard()}
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
              <NotificationBell />
              <button
                onClick={() => handlePageChange("profile")}
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
        <main className="flex-1 overflow-y-auto no-scrollbar">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
