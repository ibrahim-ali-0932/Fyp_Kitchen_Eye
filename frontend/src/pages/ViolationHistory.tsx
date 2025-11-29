import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Calendar,
  Download,
  Filter,
  Search,
  Camera,
  Clock,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function ViolationHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const violations = [
    {
      id: "VIO-2024-001",
      type: "PPE Violation",
      description: "Missing hairnet detected in food preparation area",
      severity: "Medium",
      location: "Kitchen 1 - Main Prep Area",
      timestamp: "2024-11-23 14:30:22",
      status: "Pending",
      branch: "Downtown Branch",
      image:
        "https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      id: "VIO-2024-002",
      type: "Spill Detection",
      description: "Liquid spill detected on floor near dishwashing station",
      severity: "High",
      location: "Kitchen 2 - Dishwashing Area",
      timestamp: "2024-11-23 11:15:44",
      status: "Resolved",
      branch: "Downtown Branch",
      image:
        "https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      id: "VIO-2024-003",
      type: "PPE Violation",
      description: "Missing gloves detected while handling food",
      severity: "Medium",
      location: "Kitchen 1 - Food Prep Station",
      timestamp: "2024-11-23 09:42:15",
      status: "Pending",
      branch: "Westside Branch",
      image:
        "https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      id: "VIO-2024-004",
      type: "Pest Detection",
      description: "Rodent activity detected in storage area",
      severity: "Critical",
      location: "Storage Room B",
      timestamp: "2024-11-22 22:18:33",
      status: "Resolved",
      branch: "Eastside Branch",
      image:
        "https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      id: "VIO-2024-005",
      type: "PPE Violation",
      description: "Improper mask usage detected",
      severity: "Low",
      location: "Kitchen 3 - Salad Station",
      timestamp: "2024-11-22 16:05:12",
      status: "Resolved",
      branch: "Downtown Branch",
      image:
        "https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      id: "VIO-2024-006",
      type: "Spill Detection",
      description: "Oil spill detected near cooking station",
      severity: "High",
      location: "Kitchen 1 - Cooking Area",
      timestamp: "2024-11-22 13:27:45",
      status: "Pending",
      branch: "Westside Branch",
      image:
        "https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "High":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low":
        return "bg-blue-100 text-blue-700 border-blue-200";
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
        <h1 className="text-3xl mb-2">Violation History</h1>
        <p className="text-slate-600">
          View and manage all detected violations across your locations
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg">Filters</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search violations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="ppe">PPE Violations</SelectItem>
                <SelectItem value="spill">Spill Detection</SelectItem>
                <SelectItem value="pest">Pest Detection</SelectItem>
                <SelectItem value="fire">Fire/Smoke Alerts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Severity</Label>
            <Select
              value={selectedSeverity}
              onValueChange={setSelectedSeverity}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              Select dates
            </Button>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </Card>

      {/* Violations List */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg mb-1">All Violations</h2>
            <p className="text-sm text-slate-600">
              {violations.length} total violations found
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {violations.map((violation) => (
            <div
              key={violation.id}
              className="flex gap-4 p-4 rounded-xl border hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                <ImageWithFallback
                  src={violation.image}
                  alt={violation.type}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3>{violation.type}</h3>
                      <span className="text-sm text-slate-500">
                        #{violation.id}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
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
                <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    {violation.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {violation.timestamp}
                  </span>
                  <span className="flex items-center gap-1">
                    {violation.branch}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          <p className="text-sm text-slate-600">Showing 1 to 6 of 6 results</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              Previous
            </Button>
            <Button variant="outline" className="bg-blue-50 text-blue-600">
              1
            </Button>
            <Button variant="outline" disabled>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
