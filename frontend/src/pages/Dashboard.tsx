import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  AlertTriangle,
  Droplet,
  Bug,
  Flame,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Clock,
  Camera,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { fetchStats,  StatItem, ViolationTrend, RecentViolation} from "../services/statsService";

export default function Dashboard() {
  const [stats, setStats] = useState([
    {
      title: "PPE Violations",
      value: "0",
      change: "0%",
      trend: "neutral",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Spill Violations",
      value: "0",
      change: "0%",
      trend: "neutral",
      icon: Droplet,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pest Detections",
      value: "0",
      change: "0%",
      trend: "neutral",
      icon: Bug,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Fire/Smoke Alerts",
      value: "0",
      change: "0%",
      trend: "neutral",
      icon: Flame,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Hygiene Index Score",
      value: "0%",
      change: "0%",
      trend: "neutral",
      icon: ShieldCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ]);

  const [violationData, setViolationData] = useState<ViolationTrend[]>([]);
  const [recentViolations, setRecentViolations] = useState<RecentViolation[]>([]);

  const loadDashboardData = async () => {
    // Fetch violations.txt for stats
    const violationsResponse = await fetchStats("violations.txt");
    console.log("Fetched violations data:", violationsResponse);
    if (violationsResponse?.value) {
      const lines = violationsResponse.value.split('\n').filter((line: string) => line.trim());
      console.log("Parsed lines:", lines);
      const iconMapping = {
        "PPE Violations": AlertTriangle,
        "Spill Violations": Droplet,
        "Pest Detections": Bug,
        "Fire/Smoke Alerts": Flame,
        "Hygiene Index Score": ShieldCheck,
      };
      const colorMapping = {
        "PPE Violations": { color: "text-orange-600", bgColor: "bg-orange-50" },
        "Spill Violations": { color: "text-blue-600", bgColor: "bg-blue-50" },
        "Pest Detections": { color: "text-red-600", bgColor: "bg-red-50" },
        "Fire/Smoke Alerts": { color: "text-purple-600", bgColor: "bg-purple-50" },
        "Hygiene Index Score": { color: "text-green-600", bgColor: "bg-green-50" },
      };
      
      const parsedStats = lines.map((line: string) => {
        const [title, value, change, trend] = line.split('|');
        return {
          title,
          value,
          change,
          trend,
          icon: iconMapping[title as keyof typeof iconMapping] || AlertTriangle,
          color: colorMapping[title as keyof typeof colorMapping]?.color || "text-gray-600",
          bgColor: colorMapping[title as keyof typeof colorMapping]?.bgColor || "bg-gray-50",
        };
      });
      console.log("Parsed stats:", parsedStats);
      setStats(parsedStats);
    }

    // Fetch violation_trend.txt for chart data
    const trendResponse = await fetchStats("violation_trend.txt");
    if (trendResponse?.value) {
      const lines = trendResponse.value.split('\n').filter((line: string) => line.trim());
      const parsedTrend = lines.slice(1).map((line: string) => {
        const [day, ppe, spill, pest, fire] = line.split(',');
        return {
          day,
          ppe: parseInt(ppe),
          spill: parseInt(spill),
          pest: parseInt(pest),
          fire: parseInt(fire),
        };
      });
      setViolationData(parsedTrend);
    }

    // Fetch recent_violations.txt
    const recentResponse = await fetchStats("recent_violations.txt");
    if (recentResponse?.value) {
      const lines = recentResponse.value.split('\n').filter((line: string) => line.trim());
      const parsedViolations = lines.map((line: string) => {
        const [id, type, description, severity, location, timestamp, status, image] = line.split('|');
        return {
          id: parseInt(id),
          type,
          description,
          severity,
          location,
          timestamp,
          status,
          image,
        };
      });
      setRecentViolations(parsedViolations);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Reload data when window regains focus
    const handleFocus = () => {
      loadDashboardData();
    };

    window.addEventListener('focus', handleFocus);
    
    // Optional: Auto-refresh every 10 seconds
    const interval = setInterval(loadDashboardData, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "High":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "Resolved"
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-blue-100 text-blue-700 border-blue-200";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl mb-2">Dashboard</h1>
        <p className="text-slate-600">
          Monitor hygiene compliance and safety violations in real-time
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              {stat.trend !== "neutral" && (
                <div
                  className={`flex items-center gap-1 text-sm ${
                    stat.trend === "up" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{stat.change}</span>
                </div>
              )}
            </div>
            <div>
              <div className="text-3xl mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.title}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Violations Chart */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl mb-1">Violations Per Day</h2>
          <p className="text-sm text-slate-600">
            Last 12 days violation trends by category
          </p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={violationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fill: "#64748b" }} />
            <YAxis tick={{ fill: "#64748b" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Legend />
            <Bar
              dataKey="ppe"
              fill="#f97316"
              name="PPE Violations"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="spill"
              fill="#3b82f6"
              name="Spill Violations"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="pest"
              fill="#ef4444"
              name="Pest Detections"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="fire"
              fill="#a855f7"
              name="Fire Alerts"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Violations */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl mb-1">Recent Violations</h2>
          <p className="text-sm text-slate-600">
            Latest detected violations across all locations
          </p>
        </div>
        <div className="space-y-4">
          {recentViolations.map((violation) => (
            <div
              key={violation.id}
              className="flex gap-4 p-4 rounded-xl border hover:shadow-md transition-shadow"
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                <ImageWithFallback
                  src={violation.image}
                  alt={violation.type}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="mb-1">{violation.type}</h3>
                    <p className="text-sm text-slate-600">
                      {violation.description}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge
                      className={getSeverityColor(violation.severity)}
                      variant="outline"
                    >
                      {violation.severity}
                    </Badge>
                    <Badge
                      className={getStatusColor(violation.status)}
                      variant="outline"
                    >
                      {violation.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    {violation.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {violation.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
