// frontend/src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Shirt, ChefHat, Hand, Flame, ShieldCheck,
  TrendingUp, TrendingDown, Clock, Camera,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../components/ui/select";
import { fetchDashboard, DashboardData } from "../services/statsService";
import { fetchViolationImage } from "../services/violationsService";

const DAY_OPTIONS = [
  { label: "Last 7 Days",  value: 7  },
  { label: "Last 14 Days", value: 14 },
  { label: "Last 30 Days", value: 30 },
];

export default function Dashboard() {
  const [days, setDays]       = useState(7);
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  const load = async (d: number) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
      setLoading(false);
      setError("Internet disconnected. Reconnect to load dashboard data.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const dashboard = await fetchDashboard(d);
      setData(dashboard);

      const imagePairs = await Promise.all(
        (dashboard.recent_violations || []).map(async (violation) => {
          try {
            const imageUrl = await fetchViolationImage(violation.id);
            return [violation.id, imageUrl] as const;
          } catch {
            return [violation.id, null] as const;
          }
        })
      );

      setImageUrls((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
        const next: Record<string, string> = {};
        imagePairs.forEach(([id, url]) => {
          if (url) next[id] = url;
        });
        return next;
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onOnline = () => {
      setIsOffline(false);
      load(days);
    };
    const onOffline = () => {
      setIsOffline(true);
      setError("Internet disconnected. Reconnect to load dashboard data.");
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    load(days);
    const iv = setInterval(() => {
      if (typeof navigator === "undefined" || navigator.onLine) {
        load(days);
      }
    }, 30000);

    return () => {
      clearInterval(iv);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [days]);

  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  const s = data?.summary;
  const chart = (data?.chart?.days ?? []).map((d) => ({
    day: d.date.slice(5), apron: d.apron, gloves: d.gloves, hairnet: d.hairnet, fire: d.fire,
  }));
  const recent = data?.recent_violations ?? [];

  const cards = [
    { title: "Apron Alerts",       value: s?.apron_count   ?? 0, change: s?.apron_change_pct   ?? 0, icon: Shirt,   color: "text-orange-600", bg: "bg-orange-50"  },
    { title: "Gloves Alerts",      value: s?.gloves_count  ?? 0, change: s?.gloves_change_pct  ?? 0, icon: Hand,    color: "text-blue-600",   bg: "bg-blue-50"    },
    { title: "Hairnet Alerts",     value: s?.hairnet_count ?? 0, change: s?.hairnet_change_pct ?? 0, icon: ChefHat, color: "text-red-600",    bg: "bg-red-50"     },
    { title: "Fire Alerts",        value: s?.fire_count    ?? 0, change: s?.fire_change_pct    ?? 0, icon: Flame,   color: "text-purple-600", bg: "bg-purple-50"  },
    { title: "Hygiene Index Score",value: `${s?.hygiene_score ?? 100}%`, change: null,            icon: ShieldCheck,   color: "text-green-600",  bg: "bg-green-50"   },
  ];

  const getSev = (s: string) =>
    s === "High" ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-yellow-100 text-yellow-700 border-yellow-200";
  const getSta = (s: string) =>
    s === "Resolved" ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Dashboard</h1>
          <p className="text-slate-600">Monitor hygiene compliance and safety violations in real-time</p>
        </div>
        <Select value={String(days)} onValueChange={(v: string) => setDays(Number(v))}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DAY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isOffline && (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
          You are offline. Dashboard data will refresh automatically when internet is restored.
        </div>
      )}

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">Error: {error}</div>}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
                <c.icon className={`w-6 h-6 ${c.color}`} />
              </div>
              {c.change !== null && c.change !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${c.change > 0 ? "text-red-600" : "text-green-600"}`}>
                  {c.change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{Math.abs(c.change)}%</span>
                </div>
              )}
            </div>
            <div className="text-3xl mb-1">{loading ? "—" : c.value}</div>
            <div className="text-sm text-slate-600">{c.title}</div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl mb-1">Violations Per Day</h2>
          <p className="text-sm text-slate-600">Last {days} days violation trends by category</p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fill: "#64748b" }} />
            <YAxis tick={{ fill: "#64748b" }} />
            <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
            <Legend />
            <Bar dataKey="apron"   fill="#f97316" name="Apron Alerts"    radius={[8,8,0,0]} />
            <Bar dataKey="gloves"  fill="#3b82f6" name="Gloves Alerts"   radius={[8,8,0,0]} />
            <Bar dataKey="hairnet" fill="#ef4444" name="Hairnet Alerts"  radius={[8,8,0,0]} />
            <Bar dataKey="fire"  fill="#a855f7" name="Fire Alerts"      radius={[8,8,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Violations */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl mb-1">Recent Violations</h2>
          <p className="text-sm text-slate-600">Latest detected violations across all cameras</p>
        </div>
        <div className="space-y-4">
          {!loading && recent.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No violations recorded yet.</p>
          )}
          {recent.map((v) => (
            <div key={v.id} className="flex gap-4 p-4 rounded-xl border hover:shadow-md transition-shadow">
              <div className="w-40 h-24 rounded-lg overflow-hidden bg-slate-100 border flex-shrink-0">
                {imageUrls[v.id] ? (
                  <img src={imageUrls[v.id]} alt={v.type} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="mb-1">{v.type}</h3>
                    <p className="text-sm text-slate-600">{v.description}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge className={getSev(v.severity)} variant="outline">{v.severity}</Badge>
                    <Badge className={getSta(v.status)}  variant="outline">{v.status}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1"><Camera className="w-4 h-4" />{v.location}</span>
                  <span className="flex items-center gap-1"><Clock   className="w-4 h-4" />{v.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
