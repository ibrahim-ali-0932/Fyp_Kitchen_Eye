import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar, Download, FileText, Loader2 } from "lucide-react";
import { generateViolationReport } from "../services/reportService";

export default function Reports() {
  const [reportType, setReportType] = useState<"weekly" | "monthly" | "quarterly" | "custom">("monthly");
  const [outputFormat, setOutputFormat] = useState<"csv" | "pdf">("pdf");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onGenerate = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await generateViolationReport({
        reportType,
        outputFormat,
        startDate: reportType === "custom" ? startDate : undefined,
        endDate: reportType === "custom" ? endDate : undefined,
        includeImages: outputFormat === "pdf",
      });
      setSuccess(`Report generated and downloaded as ${outputFormat.toUpperCase()}.`);
    } catch (e: any) {
      setError(e.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const reportTemplates = [
    {
      name: "Monthly Compliance Report",
      description:
        "Comprehensive monthly report with all violations, trends, and compliance metrics",
      frequency: "Monthly",
      icon: FileText,
    },
    {
      name: "Weekly Summary",
      description: "Quick weekly overview of violations and key metrics",
      frequency: "Weekly",
      icon: FileText,
    },
    {
      name: "Quarterly Audit Report",
      description:
        "Detailed quarterly report for regulatory compliance and audits",
      frequency: "Quarterly",
      icon: FileText,
    },
    {
      name: "Custom Date Range Report",
      description: "Generate reports for any custom date range you need",
      frequency: "On-demand",
      icon: FileText,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl mb-2">Reports</h1>
        <p className="text-slate-600">
          Generate and download compliance reports for audits and analysis
        </p>
      </div>

      {/* Generate New Report */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl mb-2">Generate New Report</h2>
            <p className="text-sm text-slate-600 mb-4">
              Create violation reports from your live Firestore data
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={reportType} onValueChange={(v) => setReportType(v as typeof reportType)}>
                <SelectTrigger className="w-48 bg-white">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                  <SelectItem value="quarterly">Quarterly Report</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as typeof outputFormat)}>
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>

              {reportType === "custom" && (
                <>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-44 bg-white"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-44 bg-white"
                  />
                </>
              )}

              <Button className="bg-blue-600 hover:bg-blue-700" onClick={onGenerate} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Generate Report
              </Button>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            {success && <p className="text-sm text-green-700 mt-3">{success}</p>}
          </div>
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-8 h-8 text-white" />
          </div>
        </div>
      </Card>

      {/* Report Templates */}
      <div>
        <h2 className="text-xl mb-4">Report Templates</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTemplates.map((template, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <template.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="mb-2">{template.name}</h3>
              <p className="text-sm text-slate-600 mb-4">
                {template.description}
              </p>
              <Badge variant="outline" className="text-xs">
                {template.frequency}
              </Badge>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Export */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Quick Export</h2>
          <Badge variant="outline">Live Data</Badge>
        </div>
        <div className="space-y-3">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="mb-1">Current Selection</h3>
                <p className="text-sm text-slate-600">
                  {reportType.toUpperCase()} report in {outputFormat.toUpperCase()} format
                </p>
              </div>
              <Button onClick={onGenerate} disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                Download Now
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Report Preview */}
      <Card className="p-6">
        <h2 className="text-xl mb-4">Report Preview</h2>
        <div className="bg-slate-50 rounded-xl p-8 border-2 border-dashed border-slate-200">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl mb-2">Violation Report Preview</h3>
              <p className="text-slate-600 mb-6">Generated from live violations data</p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Violations</p>
                <p className="text-2xl">Live</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Apron Alerts</p>
                <p className="text-2xl text-orange-600">Included</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Hairnet Alerts</p>
                <p className="text-2xl text-red-600">Included</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Format</p>
                <p className="text-2xl">{outputFormat.toUpperCase()}</p>
              </div>
            </div>

            <div className="text-center text-sm text-slate-500">
              Use Generate Report to download full PDF or CSV
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
