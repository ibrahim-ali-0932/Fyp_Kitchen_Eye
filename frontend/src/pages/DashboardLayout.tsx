import { useState } from "react";
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
  | "subscription";

export default function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const menuItems = [
    { id: "dashboard" as Page, icon: LayoutDashboard, label: "Dashboard" },
    { id: "violations" as Page, icon: History, label: "Violation History" },
    { id: "cameras" as Page, icon: Camera, label: "Live Camera Feed" },
    { id: "analytics" as Page, icon: TrendingUp, label: "Analytics & Trends" },
    { id: "reports" as Page, icon: FileText, label: "Reports" },
    { id: "notifications" as Page, icon: Bell, label: "Notification Settings" }
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <span className="tracking-tight">KitchenEye</span>
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
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate">John Don</p>
                <p className="text-sm text-slate-400 truncate">
                  johndoe@company.com
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
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate">John Don</p>
                  <p className="text-sm text-slate-400 truncate">
                    johndoe@company.com
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
              <Avatar className="cursor-pointer">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{renderPage()}</main>
      </div>
    </div>
  );
}
