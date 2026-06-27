"use client";

import { useState, useEffect } from "react";
import { mockService } from "@/lib/api/mockService";
import { Dialog } from "@/components/layout/Dialog";
import { AttendanceRecord, LeaveRequest } from "@/types/attendance";
import { User } from "@/types/user";
import {
  CalendarDays,
  ClipboardCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AttendancePage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"daily" | "logs" | "leaves">("daily");

  // Search, Dates, filters
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchLogs, setSearchLogs] = useState("");
  const [searchLeaves, setSearchLeaves] = useState("");

  // Grid editing states for daily attendance
  const [dailyRecords, setDailyRecords] = useState<
    Record<string, { status: AttendanceRecord["status"]; remarks: string }>
  >({});

  // Leave modals
  const [isLeaveReqOpen, setIsLeaveReqOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employee_id: "",
    leave_type: "Casual" as LeaveRequest["leave_type"],
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const emps = mockService.getEmployees().filter((e) => e.is_active);
    setEmployees(emps);
    setAttendance(mockService.getAttendance());
    setLeaves(mockService.getLeaveRequests());

    // Initialize daily records mapping for active employees
    const records: typeof dailyRecords = {};
    emps.forEach((emp) => {
      records[emp.id] = { status: "Present", remarks: "" };
    });
    setDailyRecords(records);
  };

  // Sync dailyRecords with database if data already marked for chosen date
  useEffect(() => {
    const dateRecords = attendance.filter((r) => r.date === dailyDate);
    if (dateRecords.length > 0) {
      const records: typeof dailyRecords = {};
      employees.forEach((emp) => {
        const found = dateRecords.find((r) => r.employee_id === emp.id);
        records[emp.id] = {
          status: found ? found.status : "Present",
          remarks: found ? found.remarks : "",
        };
      });
      setDailyRecords(records);
    } else {
      const records: typeof dailyRecords = {};
      employees.forEach((emp) => {
        records[emp.id] = { status: "Present", remarks: "" };
      });
      setDailyRecords(records);
    }
  }, [dailyDate, attendance, employees]);

  const handleStatusChange = (empId: string, status: AttendanceRecord["status"]) => {
    setDailyRecords((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], status },
    }));
  };

  const handleRemarksChange = (empId: string, remarks: string) => {
    setDailyRecords((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], remarks },
    }));
  };

  const handleSaveAttendance = () => {
    const records = Object.entries(dailyRecords).map(([empId, item]) => ({
      employee_id: empId,
      status: item.status,
      remarks: item.remarks,
    }));
    mockService.saveDailyAttendance(dailyDate, records);
    loadData();
    alert("Attendance saved successfully!");
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.employee_id || !leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason) {
      setFormError("All fields are required.");
      return;
    }
    mockService.createLeaveRequest(leaveForm);
    setIsLeaveReqOpen(false);
    loadData();
  };

  const handleLeaveApproval = (id: string, status: "Approved" | "Rejected") => {
    const remarks = prompt(`Enter ${status.toLowerCase()} remarks (optional):`) || "";
    mockService.updateLeaveStatus(id, status, remarks, "System Admin");
    loadData();
  };

  const getEmployeeName = (id: string) => {
    const emp = mockService.getEmployees().find((e) => e.id === id);
    return emp ? emp.full_name : "Unknown Employee";
  };

  const getEmployeeCode = (id: string) => {
    const emp = mockService.getEmployees().find((e) => e.id === id);
    return emp ? (emp as any).employee_code : "—";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance & Leaves</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mark daily attendance logs, track active personnel list, and review employee leave requests.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("daily")}
            className={cn(
              "pb-3.5 text-sm font-semibold border-b-2 transition-colors",
              activeTab === "daily"
                ? "border-brand-500 text-brand-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Daily Entry Grid
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={cn(
              "pb-3.5 text-sm font-semibold border-b-2 transition-colors",
              activeTab === "logs"
                ? "border-brand-500 text-brand-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Attendance History
          </button>
          <button
            onClick={() => setActiveTab("leaves")}
            className={cn(
              "pb-3.5 text-sm font-semibold border-b-2 transition-colors",
              activeTab === "leaves"
                ? "border-brand-500 text-brand-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Leave Requests
          </button>
        </div>
      </div>

      {/* TAB CONTENT: DAILY ENTRY GRID */}
      {activeTab === "daily" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="h-5 w-5 text-brand-400" />
              <span className="text-sm font-semibold text-foreground">Date:</span>
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              onClick={handleSaveAttendance}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg shadow-lg hover:shadow-brand-500/20 transition-all duration-150"
            >
              <ClipboardCheck className="h-4 w-4" />
              Save Attendance
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border">
                <tr>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground w-1/6">Emp Code</th>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground w-1/4">Name</th>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground w-1/3">Status Selection</th>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((emp) => {
                  const record = dailyRecords[emp.id] || { status: "Present", remarks: "" };
                  return (
                    <tr key={emp.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-foreground">
                        {(emp as any).employee_code || "—"}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{emp.full_name}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {(["Present", "Absent", "On Leave", "Half Day"] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(emp.id, st)}
                              className={cn(
                                "px-3 py-1 rounded-md text-xs font-semibold border transition-all duration-150",
                                record.status === st
                                  ? st === "Present"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : st === "Absent"
                                      ? "bg-red-500/10 text-red-400 border-red-500/30"
                                      : st === "On Leave"
                                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-slate-500/5"
                              )}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={record.remarks}
                          onChange={(e) => handleRemarksChange(emp.id, e.target.value)}
                          placeholder="Add comments..."
                          className="w-full px-3 py-1.5 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ATTENDANCE HISTORY LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border">
            <div className="relative w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs by employee code, name..."
                value={searchLogs}
                onChange={(e) => setSearchLogs(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Listing */}
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border">
                <tr>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground">Date</th>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground">Emp Code</th>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground">Name</th>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendance
                  .filter((r) => {
                    const empName = getEmployeeName(r.employee_id).toLowerCase();
                    const empCode = getEmployeeCode(r.employee_id).toLowerCase();
                    const query = searchLogs.toLowerCase();
                    return empName.includes(query) || empCode.includes(query);
                  })
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="px-6 py-4 text-foreground font-mono">{log.date}</td>
                      <td className="px-6 py-4 font-mono text-foreground">{getEmployeeCode(log.employee_id)}</td>
                      <td className="px-6 py-4 text-foreground font-medium">{getEmployeeName(log.employee_id)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border",
                            log.status === "Present" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            log.status === "Absent" && "bg-red-500/10 text-red-400 border-red-500/20",
                            log.status === "On Leave" && "bg-purple-500/10 text-purple-400 border-purple-500/20",
                            log.status === "Half Day" && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{log.remarks || "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: LEAVE REQUESTS */}
      {activeTab === "leaves" && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search leaves by name..."
                value={searchLeaves}
                onChange={(e) => setSearchLeaves(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              onClick={() => {
                setLeaveForm({
                  employee_id: employees[0]?.id || "",
                  leave_type: "Casual",
                  start_date: "",
                  end_date: "",
                  reason: "",
                });
                setFormError(null);
                setIsLeaveReqOpen(true);
              }}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg shadow-lg hover:shadow-brand-500/20 transition-all duration-150 self-start sm:self-center"
            >
              <Plus className="h-4 w-4" />
              Apply Leave
            </button>
          </div>

          {/* List requests */}
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border">
                <tr>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground">Employee</th>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground">Leave Type</th>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground">Dates</th>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground">Reason</th>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-muted-foreground text-right">Approve Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaves
                  .filter((r) => getEmployeeName(r.employee_id).toLowerCase().includes(searchLeaves.toLowerCase()))
                  .map((l) => (
                    <tr key={l.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-foreground font-semibold">{getEmployeeName(l.employee_id)}</div>
                        <div className="text-xs font-mono text-muted-foreground">{getEmployeeCode(l.employee_id)}</div>
                      </td>
                      <td className="px-6 py-4 text-foreground font-medium">{l.leave_type}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {l.start_date} to {l.end_date}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-xs truncate" title={l.reason}>
                        {l.reason}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border",
                            l.status === "Approved" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            l.status === "Rejected" && "bg-red-500/10 text-red-400 border-red-500/20",
                            l.status === "Pending" && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {l.status === "Pending" ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleLeaveApproval(l.id, "Approved")}
                              className="p-1 rounded-md text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                              title="Approve Leave"
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleLeaveApproval(l.id, "Rejected")}
                              className="p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                              title="Reject Leave"
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Reviewed by: {l.approved_by || "—"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAVE DIALOG */}
      <Dialog isOpen={isLeaveReqOpen} onClose={() => setIsLeaveReqOpen(false)} title="Apply for Leave" size="sm">
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Applicant Employee *</label>
            <select
              value={leaveForm.employee_id}
              onChange={(e) => setLeaveForm({ ...leaveForm, employee_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              required
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Leave Type *</label>
            <select
              value={leaveForm.leave_type}
              onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value as LeaveRequest["leave_type"] })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              required
            >
              <option value="Casual">Casual Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Earned">Earned Leave</option>
              <option value="Maternity/Paternity">Maternity/Paternity</option>
              <option value="LWP">Leave Without Pay (LWP)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Start Date *</label>
              <input
                type="date"
                value={leaveForm.start_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">End Date *</label>
              <input
                type="date"
                value={leaveForm.end_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Reason / Comments *</label>
            <textarea
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              placeholder="State clear reasons..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsLeaveReqOpen(false)}
              className="px-4 py-2 border border-input rounded-lg text-sm font-medium hover:bg-muted text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Submit Application
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
