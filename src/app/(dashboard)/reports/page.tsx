"use client";

import { useState, useEffect } from "react";
import { mockService } from "@/lib/api/mockService";
import { Project } from "@/types/projects";
import { User } from "@/types/user";
import { Department } from "@/types/masters";
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  FileText,
  Filter,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ReportType =
  | "Daily Production"
  | "Monthly Production"
  | "Employee Productivity"
  | "Attendance"
  | "Project"
  | "Revision";

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Selection
  const [selectedReport, setSelectedReport] = useState<ReportType>("Daily Production");
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    project: "all",
    department: "all",
    employee: "all",
  });

  const [generatedReport, setGeneratedReport] = useState<any[] | null>(null);
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);

  useEffect(() => {
    setProjects(mockService.getProjects());
    setEmployees(mockService.getEmployees());
    setDepartments(mockService.getDepartments());
  }, []);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create random mock report rows based on selected report type to simulate real data
    const records = [];
    if (selectedReport === "Daily Production") {
      records.push(
        { date: filters.startDate, code: "PRJ-101", title: "Project Orion", quantity: 12, tonnage: 28.5 },
        { date: filters.startDate, code: "PRJ-102", title: "Project Apollo", quantity: 8, tonnage: 11.2 }
      );
    } else if (selectedReport === "Monthly Production") {
      records.push(
        { month: "June 2026", code: "PRJ-101", title: "Project Orion", quantity: 240, tonnage: 580.4 },
        { month: "June 2026", code: "PRJ-102", title: "Project Apollo", quantity: 185, tonnage: 310.2 }
      );
    } else if (selectedReport === "Employee Productivity") {
      records.push(
        { code: "EMP-002", name: "John Doe", dept: "Engineering", sheets: 45, tonnage: 112.4 },
        { code: "EMP-003", name: "Alice Smith", dept: "Production", sheets: 30, tonnage: 64.8 }
      );
    } else if (selectedReport === "Attendance") {
      records.push(
        { code: "EMP-001", name: "System Admin", present: 22, absent: 0, leave: 0, rate: "100%" },
        { code: "EMP-002", name: "John Doe", present: 20, absent: 1, leave: 1, rate: "91%" },
        { code: "EMP-003", name: "Alice Smith", present: 19, absent: 0, leave: 3, rate: "86%" }
      );
    } else if (selectedReport === "Project") {
      records.push(
        { code: "PRJ-101", name: "Project Orion", client: "Tesla", start: "2026-01-01", end: "2026-12-31", status: "In Progress" },
        { code: "PRJ-102", name: "Project Apollo", client: "SpaceX", start: "2026-03-15", end: "2026-09-15", status: "In Progress" }
      );
    } else if (selectedReport === "Revision") {
      records.push(
        { code: "PRJ-101", drw: "DRW-ORION-001", type: "Internal Revision", date: "2026-06-25", billable: "No" },
        { code: "PRJ-101", drw: "DRW-ORION-002", type: "Client Revision", date: "2026-06-27", billable: "Yes" }
      );
    }

    setGeneratedReport(records);
  };

  const handleExport = (type: "excel" | "pdf") => {
    setIsExporting(type);
    setTimeout(() => {
      setIsExporting(null);
      alert(`Report exported successfully as ${type.toUpperCase()}!`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Operational Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate, review, and export structural detailing metrics, timesheets, and revisions schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Settings Panel */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Filter className="h-5 w-5 text-brand-400" />
            <h3 className="text-sm font-bold text-foreground">Report Config</h3>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Report Type</label>
              <select
                value={selectedReport}
                onChange={(e) => {
                  setSelectedReport(e.target.value as ReportType);
                  setGeneratedReport(null);
                }}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              >
                <option value="Daily Production">Daily Production Report</option>
                <option value="Monthly Production">Monthly Production Report</option>
                <option value="Employee Productivity">Employee Productivity Report</option>
                <option value="Attendance">Attendance Report</option>
                <option value="Project">Project Report</option>
                <option value="Revision">Revision Report</option>
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
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
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
                <option value="all">All Staff</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
            >
              Generate Report
            </button>
          </form>
        </div>

        {/* Right: Output Table */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-brand-400" />
                <h3 className="text-sm font-bold text-foreground">Report Output: {selectedReport}</h3>
              </div>

              {generatedReport && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport("excel")}
                    disabled={isExporting !== null}
                    className="flex items-center gap-1 px-3 py-1.5 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded text-xs font-semibold disabled:opacity-50"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    {isExporting === "excel" ? "Exporting..." : "Excel"}
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    disabled={isExporting !== null}
                    className="flex items-center gap-1 px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded text-xs font-semibold disabled:opacity-50"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {isExporting === "pdf" ? "Exporting..." : "PDF"}
                  </button>
                </div>
              )}
            </div>

            {/* Table wrapper */}
            <div className="overflow-x-auto">
              {!generatedReport ? (
                <div className="py-24 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  Configure the filters and click &quot;Generate Report&quot; to load data.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border">
                    {selectedReport === "Daily Production" && (
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Date</th>
                        <th className="p-3 font-semibold text-muted-foreground">Project Code</th>
                        <th className="p-3 font-semibold text-muted-foreground">Project Name</th>
                        <th className="p-3 font-semibold text-muted-foreground">Sheets</th>
                        <th className="p-3 font-semibold text-muted-foreground">Tonnage (MT)</th>
                      </tr>
                    )}
                    {selectedReport === "Monthly Production" && (
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Month</th>
                        <th className="p-3 font-semibold text-muted-foreground">Project Code</th>
                        <th className="p-3 font-semibold text-muted-foreground">Project Name</th>
                        <th className="p-3 font-semibold text-muted-foreground">Sheets</th>
                        <th className="p-3 font-semibold text-muted-foreground">Tonnage (MT)</th>
                      </tr>
                    )}
                    {selectedReport === "Employee Productivity" && (
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Code</th>
                        <th className="p-3 font-semibold text-muted-foreground">Draftsman</th>
                        <th className="p-3 font-semibold text-muted-foreground">Department</th>
                        <th className="p-3 font-semibold text-muted-foreground">Sheets Approved</th>
                        <th className="p-3 font-semibold text-muted-foreground">Tonnage (MT)</th>
                      </tr>
                    )}
                    {selectedReport === "Attendance" && (
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Code</th>
                        <th className="p-3 font-semibold text-muted-foreground">Employee Name</th>
                        <th className="p-3 font-semibold text-muted-foreground">Present Days</th>
                        <th className="p-3 font-semibold text-muted-foreground">Absent Days</th>
                        <th className="p-3 font-semibold text-muted-foreground">Leave Days</th>
                        <th className="p-3 font-semibold text-muted-foreground">Attendance Rate</th>
                      </tr>
                    )}
                    {selectedReport === "Project" && (
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Code</th>
                        <th className="p-3 font-semibold text-muted-foreground">Project Name</th>
                        <th className="p-3 font-semibold text-muted-foreground">Client</th>
                        <th className="p-3 font-semibold text-muted-foreground">Start</th>
                        <th className="p-3 font-semibold text-muted-foreground">End</th>
                        <th className="p-3 font-semibold text-muted-foreground">Status</th>
                      </tr>
                    )}
                    {selectedReport === "Revision" && (
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground">Project</th>
                        <th className="p-3 font-semibold text-muted-foreground">Drawing Number</th>
                        <th className="p-3 font-semibold text-muted-foreground">Revision Type</th>
                        <th className="p-3 font-semibold text-muted-foreground">Date</th>
                        <th className="p-3 font-semibold text-muted-foreground">Billable</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-border">
                    {generatedReport.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                        {selectedReport === "Daily Production" && (
                          <>
                            <td className="p-3 font-mono">{row.date}</td>
                            <td className="p-3 font-mono font-semibold">{row.code}</td>
                            <td className="p-3 font-medium text-foreground">{row.title}</td>
                            <td className="p-3 font-semibold">{row.quantity}</td>
                            <td className="p-3 font-semibold text-brand-400">{row.tonnage} MT</td>
                          </>
                        )}
                        {selectedReport === "Monthly Production" && (
                          <>
                            <td className="p-3 font-mono">{row.month}</td>
                            <td className="p-3 font-mono font-semibold">{row.code}</td>
                            <td className="p-3 font-medium text-foreground">{row.title}</td>
                            <td className="p-3 font-semibold">{row.quantity}</td>
                            <td className="p-3 font-semibold text-brand-400">{row.tonnage} MT</td>
                          </>
                        )}
                        {selectedReport === "Employee Productivity" && (
                          <>
                            <td className="p-3 font-mono">{row.code}</td>
                            <td className="p-3 font-medium text-foreground">{row.name}</td>
                            <td className="p-3 text-muted-foreground">{row.dept}</td>
                            <td className="p-3 font-semibold">{row.sheets}</td>
                            <td className="p-3 font-semibold text-brand-400">{row.tonnage} MT</td>
                          </>
                        )}
                        {selectedReport === "Attendance" && (
                          <>
                            <td className="p-3 font-mono">{row.code}</td>
                            <td className="p-3 font-medium text-foreground">{row.name}</td>
                            <td className="p-3">{row.present}</td>
                            <td className="p-3">{row.absent}</td>
                            <td className="p-3">{row.leave}</td>
                            <td className="p-3 font-semibold text-brand-400">{row.rate}</td>
                          </>
                        )}
                        {selectedReport === "Project" && (
                          <>
                            <td className="p-3 font-mono font-semibold">{row.code}</td>
                            <td className="p-3 font-medium text-foreground">{row.name}</td>
                            <td className="p-3 text-muted-foreground">{row.client}</td>
                            <td className="p-3 font-mono">{row.start}</td>
                            <td className="p-3 font-mono">{row.end}</td>
                            <td className="p-3 font-semibold">{row.status}</td>
                          </>
                        )}
                        {selectedReport === "Revision" && (
                          <>
                            <td className="p-3 font-mono font-semibold">{row.code}</td>
                            <td className="p-3 font-medium text-foreground font-mono">{row.drw}</td>
                            <td className="p-3">{row.type}</td>
                            <td className="p-3 font-mono">{row.date}</td>
                            <td className="p-3 font-semibold">{row.billable}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
