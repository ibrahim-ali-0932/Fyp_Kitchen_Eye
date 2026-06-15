// frontend/src/pages/Analytics.tsx
import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../components/ui/select";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { fetchChart, fetchSummary, ChartDay, ViolationSummary } from "../services/statsService";
import BranchSelector from "../components/BranchSelector";

const DAY_OPTIONS = [
  { label: "Last 7 Days",  value: 7  },
  { label: "Last 14 Days", value: 14 },
  { label: "Last 30 Days", value: 30 },
];

export default function Analytics() {
  const [days, setDays]         = useState(7);
  const [branchId, setBranchId] = useState("all");
  const [chart, setChart]       = useState<ChartDay[]>([]);
  const [summary, setSummary]   = useState<ViolationSummary | null>(null);
  const [loading, setLoading]   = useState(true);

  const load = async (d: number, bid: string) => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([fetchChart(d, bid), fetchSummary(bid)]);
      setChart(c.days || []);
      setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(days, branchId); }, [days, branchId]);

  const trendData = chart.map((d) => ({
    day: d.date.slice(5), apron: d.apron, gloves: d.gloves, hairnet: d.hairnet, fire: d.fire,
  }));

  const pieData = summary ? [
    { name: "Apron Alerts",   value: summary.apron_count,   color: "#f97316" },
    { name: "Gloves Alerts",  value: summary.gloves_count,  color: "#3b82f6" },
    { name: "Hairnet Alerts", value: summary.hairnet_count, color: "#ef4444" },
    { name: "Fire Alerts",    value: summary.fire_count,    color: "#a855f7" },
  ].filter((d) => d.value > 0) : [];

  const kpis = summary ? [
    { title: "Total Violations",  value: summary.total_count,    change: summary.apron_change_pct,   period: "vs yesterday"  },
    { title: "Hygiene Score",     value: `${summary.hygiene_score}%`, change: 0,                  period: "current score" },
    { title: "Apron Alerts",      value: summary.apron_count,       change: summary.apron_change_pct,  period: "vs yesterday"  },
    { title: "Fire Alerts",       value: summary.fire_count,      change: summary.fire_change_pct, period: "vs yesterday"  },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Analytics & Trends</h1>
          <p className="text-slate-600">Comprehensive insights into hygiene compliance and violations</p>
        </div>
        <Select value={String(days)} onValueChange={(v: string) => setDays(Number(v))}>
          <SelectTrigger className="w-48">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <BranchSelector value={branchId} onChange={setBranchId} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm text-slate-600">{k.title}</p>
              {k.change !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${k.change > 0 ? "text-red-600" : "text-green-600"}`}>
                  {k.change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{Math.abs(k.change)}%</span>
                </div>
              )}
            </div>
            <div className="text-3xl mb-1">{loading ? "—" : k.value}</div>
            <p className="text-xs text-slate-500">{k.period}</p>
          </Card>
        ))}
      </div>

      {/* Trend line chart */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl mb-1">Violation Trends</h2>
          <p className="text-sm text-slate-600">Last {days} days by category</p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fill: "#64748b" }} />
            <YAxis tick={{ fill: "#64748b" }} />
            <Tooltip contentStyle={{ backgroundColor:"white", border:"1px solid #e2e8f0", borderRadius:"8px" }} />
            <Legend />
            <Line type="monotone" dataKey="apron"   stroke="#f97316" strokeWidth={2} name="Apron"   />
            <Line type="monotone" dataKey="gloves" stroke="#3b82f6" strokeWidth={2} name="Gloves" />
            <Line type="monotone" dataKey="hairnet"  stroke="#ef4444" strokeWidth={2} name="Hairnet"  />
            <Line type="monotone" dataKey="fire"  stroke="#a855f7" strokeWidth={2} name="Fire"  />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Pie + Bar */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl mb-1">Violation Categories</h2>
            <p className="text-sm text-slate-600">Distribution by type (all-time totals)</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {pieData.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                <div className="text-sm">
                  <p className="text-slate-600">{c.name}</p>
                  <p>{c.value} total</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl mb-1">Category Totals</h2>
            <p className="text-sm text-slate-600">Today's counts by type</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pieData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b" }} />
              <Tooltip />
              <Bar dataKey="value" radius={[8,8,0,0]}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
