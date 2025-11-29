import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar, Download, FileText, Printer, Mail, Eye } from "lucide-react";

export default function Reports() {
  const reports = [
    {
      id: "RPT-2024-11",
      title: "Monthly Hygiene Compliance Report",
      period: "November 2024",
      generatedDate: "2024-11-20",
      type: "Monthly",
      status: "Ready",
      fileSize: "2.4 MB",
      violations: 156,
      branches: 4,
    },
    {
      id: "RPT-2024-10",
      title: "Monthly Hygiene Compliance Report",
      period: "October 2024",
      generatedDate: "2024-10-20",
      type: "Monthly",
      status: "Ready",
      fileSize: "2.1 MB",
      violations: 189,
      branches: 4,
    },
    {
      id: "RPT-2024-W46",
      title: "Weekly Violation Summary",
      period: "Week 46, 2024",
      generatedDate: "2024-11-17",
      type: "Weekly",
      status: "Ready",
      fileSize: "856 KB",
      violations: 42,
      branches: 4,
    },
    {
      id: "RPT-2024-W45",
      title: "Weekly Violation Summary",
      period: "Week 45, 2024",
      generatedDate: "2024-11-10",
      type: "Weekly",
      status: "Ready",
      fileSize: "782 KB",
      violations: 38,
      branches: 4,
    },
  ];

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
              Create custom reports for any time period or branch
            </p>
            <div className="flex flex-wrap gap-3">
              <Select defaultValue="monthly">
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
              <Select defaultValue="all">
                <SelectTrigger className="w-48 bg-white">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="downtown">Downtown Branch</SelectItem>
                  <SelectItem value="westside">Westside Branch</SelectItem>
                  <SelectItem value="eastside">Eastside Branch</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
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

      {/* Generated Reports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Generated Reports</h2>
          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex gap-4 flex-1">
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="mb-1">{report.title}</h3>
                        <p className="text-sm text-slate-600">
                          {report.period}
                        </p>
                      </div>
                      <Badge
                        className="bg-green-100 text-green-700 border-green-200"
                        variant="outline"
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Generated: {report.generatedDate}
                      </span>
                      <span>ID: {report.id}</span>
                      <span>Size: {report.fileSize}</span>
                      <span>{report.violations} Violations</span>
                      <span>{report.branches} Branches</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button size="sm" variant="outline">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
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
              <h3 className="text-xl mb-2">
                Monthly Hygiene Compliance Report
              </h3>
              <p className="text-slate-600 mb-6">November 2024</p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Violations</p>
                <p className="text-2xl">156</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Compliance Score</p>
                <p className="text-2xl text-green-600">87%</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Critical Alerts</p>
                <p className="text-2xl text-red-600">4</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  Avg Resolution Time
                </p>
                <p className="text-2xl">2.4h</p>
              </div>
            </div>

            <div className="text-center text-sm text-slate-500">
              Generate a report to see full preview
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
