"use client";

import { useState, useEffect } from "react";
import { getReport, downloadReportCSV } from "@/lib/api/reports";
import { getProjects } from "@/lib/api/projects";
import { getEmployees } from "@/lib/api/employees";
import { BarChart3, Filter, FileSpreadsheet, Download, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ReportType =
  | "employees"
  | "attendance"
  | "leaves"
  | "projects"
  | "production"
  | "revisions"
  | "billing"
  | "productivity";

export default function ReportsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection
  const [selectedReport, setSelectedReport] = useState<ReportType>("employees");
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    project: "",
    employee: "",
    status: "",
  });

  const [reportData, setReportData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  // Load masters for filtering
  useEffect(() => {
    getProjects()
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Projects load failed:", err));

    getEmployees()
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Employees load failed:", err));
  }, []);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Build API params
      const params: Record<string, any> = {
        page,
      };
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (filters.project) params.project = filters.project;
      if (filters.employee) params.employee = filters.employee;
      if (filters.status) params.status = filters.status;

      const data = await getReport(selectedReport, params);
      if (data && data.results) {
        setReportData(data.results);
        setTotalCount(data.count || data.results.length);
      } else if (Array.isArray(data)) {
        setReportData(data);
        setTotalCount(data.length);
      } else {
        setReportData([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      console.error("Report generation failed:", err);
      setError("Failed to fetch report data. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerate();
  }, [selectedReport, page]);

  const handleCSVExport = () => {
    const params: Record<string, any> = {};
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.project) params.project = filters.project;
    if (filters.employee) params.employee = filters.employee;
    if (filters.status) params.status = filters.status;

    downloadReportCSV(selectedReport, params);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Enterprise Reporting</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed filters, paginated results, and instant CSV export for auditing and PM reviews.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Filters Panel */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Filter className="h-5 w-5 text-brand-400" />
            <h3 className="text-sm font-bold text-foreground">Report Config</h3>
          </div>

          <form onSubmit={(e) => { setPage(1); handleGenerate(e); }} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Report Type</label>
              <select
                value={selectedReport}
                onChange={(e) => {
                  setSelectedReport(e.target.value as ReportType);
                  setReportData([]);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              >
                <option value="employees">Employee List Report</option>
                <option value="attendance">Attendance Records</option>
                <option value="leaves">Leave Requests</option>
                <option value="projects">Projects List</option>
                <option value="production">Production Entries</option>
                <option value="revisions">Document Revisions</option>
                <option value="billing">Revision Billing</option>
                <option value="productivity">Employee Productivity</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Project</label>
              <select
                value={filters.project}
                onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Employee</label>
              <select
                value={filters.employee}
                onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              >
                <option value="">All Staff</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name || e.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              >
                <option value="">Any Status</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
                <option value="Submitted">Submitted</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Generate Report
            </button>
          </form>
        </div>

        {/* Right: Output Table */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[400px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-brand-400" />
                <h3 className="text-sm font-bold text-foreground">Report Output</h3>
              </div>

              {reportData.length > 0 && (
                <button
                  onClick={handleCSVExport}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-lg text-xs font-semibold transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export CSV
                </button>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3">
                <AlertCircle className="text-destructive h-5 w-5 shrink-0" />
                <p className="text-xs text-destructive-foreground">{error}</p>
              </div>
            )}

            {/* Table wrapper */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-24 text-center text-xs text-muted-foreground animate-pulse">
                  Querying database logs...
                </div>
              ) : reportData.length === 0 ? (
                <div className="py-24 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No records matching the selected filters.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border">
                    {selectedReport === "employees" && (
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Code</th>
                        <th className="p-3 font-semibold text-muted-foreground">Name</th>
                        <th className="p-3 font-semibold text-muted-foreground">Email</th>
                        <th className="p-3 font-semibold text-muted-foreground">Department</th>
                        <th className="p-3 font-semibold text-muted-foreground">Section</th>
                        <th className="p-3 font-semibold text-muted-foreground">Status</th>
                      </tr>
                    )}
                    {selectedReport === "attendance" && (
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Code</th>
                        <th className="p-3 font-semibold text-muted-foreground">Employee</th>
                        <th className="p-3 font-semibold text-muted-foreground">Date</th>
                        <th className="p-3 font-semibold text-muted-foreground">Status</th>
                        <th className="p-3 font-semibold text-muted-foreground">Check-In</th>
                        <th className="p-3 font-semibold text-muted-foreground">Check-Out</th>
                        <th className="p-3 font-semibold text-muted-foreground">Hours</th>
                      </tr>
                    )}
                    {selectedReport === "leaves" && (
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Employee</th>
                        <th className="p-3 font-semibold text-muted-foreground">Type</th>
                        <th className="p-3 font-semibold text-muted-foreground">Start</th>
                        <th className="p-3 font-semibold text-muted-foreground">End</th>
                        <th className="p-3 font-semibold text-muted-foreground">Days</th>
                        <th className="p-3 font-semibold text-muted-foreground">Status</th>
                      </tr>
                    )}
                    {selectedReport === "projects" && (
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Code</th>
                        <th className="p-3 font-semibold text-muted-foreground">Name</th>
                        <th className="p-3 font-semibold text-muted-foreground">Client</th>
                        <th className="p-3 font-semibold text-muted-foreground">Start</th>
                        <th className="p-3 font-semibold text-muted-foreground">Budget</th>
                        <th className="p-3 font-semibold text-muted-foreground">Status</th>
                      </tr>
                    )}
                    {selectedReport === "production" && (
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Date</th>
                        <th className="p-3 font-semibold text-muted-foreground">Employee</th>
                        <th className="p-3 font-semibold text-muted-foreground">Project</th>
                        <th className="p-3 font-semibold text-muted-foreground">Category</th>
                        <th className="p-3 font-semibold text-muted-foreground">Sheets</th>
                        <th className="p-3 font-semibold text-muted-foreground">Tons</th>
                        <th className="p-3 font-semibold text-muted-foreground">Status</th>
                      </tr>
                    )}
                    {selectedReport === "revisions" && (
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Doc Number</th>
                        <th className="p-3 font-semibold text-muted-foreground">Title</th>
                        <th className="p-3 font-semibold text-muted-foreground">Rev No</th>
                        <th className="p-3 font-semibold text-muted-foreground">Reason</th>
                        <th className="p-3 font-semibold text-muted-foreground">Status</th>
                        <th className="p-3 font-semibold text-muted-foreground">Effective Date</th>
                      </tr>
                    )}
                    {selectedReport === "billing" && (
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Doc Number</th>
                        <th className="p-3 font-semibold text-muted-foreground">Title</th>
                        <th className="p-3 font-semibold text-muted-foreground">Rev No</th>
                        <th className="p-3 font-semibold text-muted-foreground">Amount</th>
                        <th className="p-3 font-semibold text-muted-foreground">Status</th>
                        <th className="p-3 font-semibold text-muted-foreground">Invoice Ref</th>
                      </tr>
                    )}
                    {selectedReport === "productivity" && (
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Code</th>
                        <th className="p-3 font-semibold text-muted-foreground">Name</th>
                        <th className="p-3 font-semibold text-muted-foreground">Assignments</th>
                        <th className="p-3 font-semibold text-muted-foreground">Allocation %</th>
                        <th className="p-3 font-semibold text-muted-foreground">Tons Detailing</th>
                        <th className="p-3 font-semibold text-muted-foreground">Score</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                        {selectedReport === "employees" && (
                          <>
                            <td className="p-3 font-mono">{row.employee_code || "—"}</td>
                            <td className="p-3 font-medium text-foreground">{row.full_name}</td>
                            <td className="p-3 text-muted-foreground">{row.email}</td>
                            <td className="p-3">{row.department_name || "—"}</td>
                            <td className="p-3">{row.section_name || "—"}</td>
                            <td className="p-3 font-semibold">{row.is_active ? "Active" : "Inactive"}</td>
                          </>
                        )}
                        {selectedReport === "attendance" && (
                          <>
                            <td className="p-3 font-mono">{row.employee_code || "—"}</td>
                            <td className="p-3 font-medium text-foreground">{row.employee_name}</td>
                            <td className="p-3 font-mono">{row.date}</td>
                            <td className="p-3 font-semibold">{row.status}</td>
                            <td className="p-3 font-mono">{row.check_in || "—"}</td>
                            <td className="p-3 font-mono">{row.check_out || "—"}</td>
                            <td className="p-3">{row.working_hours} hrs</td>
                          </>
                        )}
                        {selectedReport === "leaves" && (
                          <>
                            <td className="p-3 font-medium text-foreground">{row.employee_name}</td>
                            <td className="p-3">{row.leave_type}</td>
                            <td className="p-3 font-mono">{row.start_date}</td>
                            <td className="p-3 font-mono">{row.end_date}</td>
                            <td className="p-3 font-semibold">{row.days_count}</td>
                            <td className="p-3 font-semibold">{row.status}</td>
                          </>
                        )}
                        {selectedReport === "projects" && (
                          <>
                            <td className="p-3 font-mono font-semibold">{row.code}</td>
                            <td className="p-3 font-medium text-foreground">{row.name}</td>
                            <td className="p-3 text-muted-foreground">{row.client}</td>
                            <td className="p-3 font-mono">{row.start_date}</td>
                            <td className="p-3">₹{row.budget?.toLocaleString() || 0}</td>
                            <td className="p-3 font-semibold">{row.status}</td>
                          </>
                        )}
                        {selectedReport === "production" && (
                          <>
                            <td className="p-3 font-mono">{row.date}</td>
                            <td className="p-3 font-medium text-foreground">{row.employee_name}</td>
                            <td className="p-3 font-mono">{row.project_code}</td>
                            <td className="p-3">{row.drawing_category_name}</td>
                            <td className="p-3 font-semibold">{row.quantity}</td>
                            <td className="p-3 font-semibold text-brand-400">{row.tonnage} MT</td>
                            <td className="p-3 font-semibold">{row.status}</td>
                          </>
                        )}
                        {selectedReport === "revisions" && (
                          <>
                            <td className="p-3 font-mono">{row.document_number}</td>
                            <td className="p-3 font-medium text-foreground">{row.document_title}</td>
                            <td className="p-3 font-semibold">{row.revision_number}</td>
                            <td className="p-3 text-muted-foreground">{row.revision_reason}</td>
                            <td className="p-3 font-semibold">{row.status}</td>
                            <td className="p-3 font-mono">{row.effective_date || "—"}</td>
                          </>
                        )}
                        {selectedReport === "billing" && (
                          <>
                            <td className="p-3 font-mono">{row.document_number}</td>
                            <td className="p-3 font-medium text-foreground">{row.document_title}</td>
                            <td className="p-3 font-semibold">{row.revision_number}</td>
                            <td className="p-3 font-semibold">₹{row.charge_amount?.toLocaleString() || 0}</td>
                            <td className="p-3 font-semibold">{row.payment_status}</td>
                            <td className="p-3 font-mono">{row.invoice_reference || "—"}</td>
                          </>
                        )}
                        {selectedReport === "productivity" && (
                          <>
                            <td className="p-3 font-mono">{row.employee_code || "—"}</td>
                            <td className="p-3 font-medium text-foreground">{row.employee_name}</td>
                            <td className="p-3">{row.assignments_count}</td>
                            <td className="p-3">{row.total_allocation}%</td>
                            <td className="p-3 font-semibold text-brand-400">{row.total_tonnage} MT</td>
                            <td className="p-3 font-bold text-emerald-400">{row.productivity_score}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalCount > 10 && (
            <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
              <span className="text-xs text-muted-foreground">
                Showing {reportData.length} of {totalCount} records
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 border border-border rounded text-xs font-semibold hover:bg-slate-500/5 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page * 10 >= totalCount}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 border border-border rounded text-xs font-semibold hover:bg-slate-500/5 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
