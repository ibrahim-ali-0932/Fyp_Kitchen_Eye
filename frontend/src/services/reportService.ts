import { API_URL } from "./api";
import { authorizedFetch } from "./authToken";

type ReportType = "weekly" | "monthly" | "quarterly" | "custom";
type ReportFormat = "csv" | "pdf";

export async function generateViolationReport(params: {
  reportType: ReportType;
  outputFormat: ReportFormat;
  startDate?: string;
  endDate?: string;
}): Promise<void> {
  const response = await authorizedFetch(`${API_URL}/reports/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      report_type: params.reportType,
      output_format: params.outputFormat,
      start_date: params.startDate,
      end_date: params.endDate,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Session expired or invalid. Please log in again.");
    }
    const err = await response.text();
    throw new Error(`Report generation failed: ${response.status} - ${err}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^\"]+)"?/i);
  const filename = match?.[1] || `violations_report.${params.outputFormat}`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
