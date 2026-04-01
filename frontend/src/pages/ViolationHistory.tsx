// frontend/src/pages/ViolationHistory.tsx
import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../components/ui/select";
import { Download, Search, Camera, Clock } from "lucide-react";
import { fetchUserViolations, ViolationRecord } from "../services/violationsService";

function getSeverityColor(s: string) {
  return s === "Critical" ? "bg-red-100 text-red-700 border-red-200"
    : s === "High" ? "bg-orange-100 text-orange-700 border-orange-200"
    : "bg-yellow-100 text-yellow-700 border-yellow-200";
}

function getStatusColor(s: string) {
  return s === "Resolved"
    ? "bg-green-100 text-green-700 border-green-200"
    : "bg-blue-100 text-blue-700 border-blue-200";
}

// Map violation_type to display info
function mapViolation(v: ViolationRecord) {
  const type = v.violation_type || "unknown";
  
  // Map raw violation type to display name and severity
  let displayType = "Unknown";
  let category = "unknown";
  let severity = "Low";
  
  if (type === "no_apron") {
    displayType = "Apron";
    category = "apron";
    severity = "Medium";
  } else if (type === "no_gloves") {
    displayType = "Gloves";
    category = "gloves";
    severity = "Low";
  } else if (type === "no_hairnet") {
    displayType = "Hairnet";
    category = "hairnet";
    severity = "Low";
  } else if (type === "fire") {
    displayType = "Fire";
    category = "fire";
    severity = "High";
  }

  return {
    id: v.id,
    type: displayType,
    description: `Detected ${type.replace(/_/g, " ")}${v.confidence ? ` (${Math.round(v.confidence * 100)}% confidence)` : ""}`,
    severity,
    category,
    location: v.camera_id || v.camera_location || "Unknown",
    timestamp: v.violation_time || v.timestamp || "",
    status: v.resolved ? "Resolved" : "Pending",
  };
}

export default function ViolationHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [violations, setViolations] = useState<ReturnType<typeof mapViolation>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserViolations()
      .then((raw) => setViolations(raw.map(mapViolation)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = violations.filter((v) => {
    const matchSearch =
      !searchQuery ||
      v.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "all" || v.category === selectedCategory;
    const matchSev = selectedSeverity === "all" || v.severity.toLowerCase() === selectedSeverity;
    const matchStatus = selectedStatus === "all" || v.status.toLowerCase() === selectedStatus;
    return matchSearch && matchCat && matchSev && matchStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Violation History</h1>
        <p className="text-slate-600">View and manage all detected violations</p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2 lg:col-span-1">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search violations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="apron">Apron (no_apron)</SelectItem>
                <SelectItem value="gloves">Gloves (no_gloves)</SelectItem>
                <SelectItem value="hairnet">Hairnet (no_hairnet)</SelectItem>
                <SelectItem value="fire">Fire</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Severity</Label>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger><SelectValue placeholder="All Severities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline"><Download className="w-4 h-4 mr-2" />Export CSV</Button>
          <Button variant="outline"><Download className="w-4 h-4 mr-2" />Export PDF</Button>
        </div>
      </Card>

      {/* List */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg mb-1">All Violations</h2>
          <p className="text-sm text-slate-600">
            {loading ? "Loading..." : error ? `Error: ${error}` : `${filtered.length} violations found`}
          </p>
        </div>
        <div className="space-y-4">
          {filtered.map((v) => (
            <div key={v.id} className="flex gap-4 p-4 rounded-xl border hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3>{v.type}</h3>
                      <span className="text-sm text-slate-500">#{v.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{v.description}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge className={getSeverityColor(v.severity)} variant="outline">{v.severity}</Badge>
                    <Badge className={getStatusColor(v.status)} variant="outline">{v.status}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-600">
                  <span className="flex items-center gap-1"><Camera className="w-4 h-4" />{v.location}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{v.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-slate-500 py-8">No violations match your filters.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
