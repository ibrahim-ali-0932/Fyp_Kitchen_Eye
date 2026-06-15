// frontend/src/pages/ViolationHistory.tsx
import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../components/ui/select";
import { Download, Search, Camera, Clock, Loader2 } from "lucide-react";
import { fetchUserViolations, fetchViolationImage, ViolationRecord } from "../services/violationsService";
import { generateViolationReport } from "../services/reportService";
import BranchSelector from "../components/BranchSelector";

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
  } else if (type === "no_hairnet" || type === "no_hair_net") {
    displayType = "Hairnet";
    category = "hairnet";
    severity = "Low";
  } else if (type === "fire" || type === "fire_detected") {
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
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setDate(today.getDate() - 29);

  const [searchQuery, setSearchQuery] = useState("");
  const [branchId, setBranchId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState(monthAgo.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [violations, setViolations] = useState<ReturnType<typeof mapViolation>[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [exportingFormat, setExportingFormat] = useState<"csv" | "pdf" | null>(null);
  const [searching, setSearching] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setError(null);
    setExportError(null);
    setExportSuccess(null);

    if (startTime && !startDate) {
      setError("Please select a start date when using a start time.");
      return;
    }
    if (endTime && !endDate) {
      setError("Please select an end date when using an end time.");
      return;
    }

    const startBoundary = startDate ? new Date(`${startDate}T${startTime || "00:00"}`) : null;
    const endBoundary = endDate ? new Date(`${endDate}T${endTime || "23:59"}`) : null;
    if (startBoundary && endBoundary && endBoundary < startBoundary) {
      setError("End date/time must be on or after start date/time.");
      return;
    }

    try {
      setSearching(true);
      setLoading(true);
      const category = selectedCategory === "hairnet" ? "hair_net" : selectedCategory;
      const raw = await fetchUserViolations({
        branchId,
        search: searchQuery,
        category,
        severity: selectedSeverity,
        status: selectedStatus,
        startDate,
        endDate,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      });
      setViolations(raw.map(mapViolation));
    } catch (e: any) {
      setError(e.message || "Failed to fetch filtered violations.");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  useEffect(() => {
    let cancelled = false;

    const loadImages = async () => {
      const imagePairs = await Promise.all(
        violations.map(async (violation) => {
          try {
            const imageUrl = await fetchViolationImage(violation.id);
            return [violation.id, imageUrl] as const;
          } catch {
            return [violation.id, null] as const;
          }
        })
      );

      if (cancelled) {
        imagePairs.forEach(([, url]) => {
          if (url) {
            URL.revokeObjectURL(url);
          }
        });
        return;
      }

      setImageUrls((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
        const next: Record<string, string> = {};
        imagePairs.forEach(([id, url]) => {
          if (url) {
            next[id] = url;
          }
        });
        return next;
      });
    };

    if (loading) {
      return () => {
        cancelled = true;
      };
    }

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [violations, loading]);

  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  const handleExport = async (format: "csv" | "pdf") => {
    setExportError(null);
    setExportSuccess(null);

    if (!violations.length) {
      setExportError("No violations match the current filters.");
      return;
    }

    if (!startDate || !endDate) {
      setExportError("Please select a valid start and end date.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setExportError("End date must be on or after start date.");
      return;
    }

    setExportingFormat(format);

    try {
      await generateViolationReport({
        reportType: "custom",
        outputFormat: format,
        startDate,
        endDate,
        branchId,
        violationIds: violations.map((v) => v.id),
        includeImages: format === "pdf",
      });
      setExportSuccess(`Filtered report exported as ${format.toUpperCase()}.`);
    } catch (e: any) {
      setExportError(e.message || "Failed to export report.");
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Violation History</h1>
        <p className="text-slate-600">View and manage all detected violations</p>
      </div>

      <BranchSelector value={branchId} onChange={setBranchId} />

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
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
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 mt-4">
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Search
          </Button>
          <Button variant="outline" onClick={() => handleExport("csv")} disabled={!!exportingFormat || loading}>
            {exportingFormat === "csv" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")} disabled={!!exportingFormat || loading}>
            {exportingFormat === "pdf" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export PDF
          </Button>
        </div>
        {exportError && <p className="text-sm text-red-600 mt-3">{exportError}</p>}
        {exportSuccess && <p className="text-sm text-green-700 mt-3">{exportSuccess}</p>}
      </Card>

      {/* List */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg mb-1">All Violations</h2>
          <p className="text-sm text-slate-600">
            {loading ? "Loading..." : error ? `Error: ${error}` : `${violations.length} violations found`}
          </p>
        </div>
        <div className="space-y-4">
          {violations.map((v) => (
            <div key={v.id} className="flex gap-4 p-4 rounded-xl border hover:shadow-md transition-shadow cursor-pointer">
              <button
                type="button"
                className="w-40 h-24 rounded-lg overflow-hidden bg-slate-100 border flex-shrink-0"
                onClick={() => {
                  if (!imageUrls[v.id]) {
                    return;
                  }
                  setPreviewImageUrl(imageUrls[v.id]);
                  setPreviewTitle(`${v.type} #${v.id.slice(0, 8)}`);
                }}
              >
                {imageUrls[v.id] ? (
                  <img src={imageUrls[v.id]} alt={v.type} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                    No image
                  </div>
                )}
              </button>
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
          {!loading && violations.length === 0 && (
            <p className="text-center text-slate-500 py-8">No violations match your filters.</p>
          )}
        </div>
      </Card>

      <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
       <DialogContent className="max-w-3xl overflow-auto fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <DialogHeader>
            <DialogTitle>{previewTitle || "Violation Snapshot"}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-center">
            {previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt={previewTitle || "Violation Snapshot"}
                className="max-h-[70vh] max-w-full object-contain rounded-lg border"
              />
            ) : (
              <p className="text-sm text-slate-600">No image available.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
