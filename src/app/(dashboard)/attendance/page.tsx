"use client";

import React, { useState } from "react";
import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  UserCheck,
  Building,
  ChevronRight,
  Filter,
  Search,
  Plus,
  Check,
  X,
  Laptop,
  HelpCircle,
  Award,
  Umbrella,
} from "lucide-react";
import {
  ENTERPRISE_EMPLOYEES,
  ENTERPRISE_ATTENDANCE,
  ENTERPRISE_LEAVES,
  ENTERPRISE_LEAVE_BALANCES,
  EnterpriseAttendance,
  EnterpriseLeaveRequest,
} from "@/data/mockEnterpriseData";
import { cn } from "@/lib/utils";

export default function EnterpriseAttendancePage() {
  const [attendanceLogs, setAttendanceLogs] = useState<EnterpriseAttendance[]>(ENTERPRISE_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState<EnterpriseLeaveRequest[]>(ENTERPRISE_LEAVES);
  const [activeTab, setActiveTab] = useState<"register" | "calendar" | "leave_desk">("register");
  
  // Filtering
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Rejection Dialog
  const [rejectingLeave, setRejectingLeave] = useState<EnterpriseLeaveRequest | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  // Apply Leave Modal
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    employee_id: "emp-103",
    leave_type: "Casual Leave" as EnterpriseLeaveRequest["leave_type"],
    start_date: "2026-07-05",
    end_date: "2026-07-06",
    reason: "Personal work at municipality office",
  });

  // Analytics Calculations
  const totalStaff = ENTERPRISE_EMPLOYEES.length;
  const presentCount = attendanceLogs.filter((a) => a.status === "Present").length;
  const wfhCount = attendanceLogs.filter((a) => a.status === "Work From Home").length;
  const lateCount = attendanceLogs.filter((a) => a.is_late).length;
  const attendanceRate = Math.round(((presentCount + wfhCount) / totalStaff) * 100);

  const handleApproveLeave = (id: string) => {
    setLeaveRequests(
      leaveRequests.map((l) => (l.id === id ? { ...l, status: "Approved", approved_by: "Rajesh Sharma" } : l))
    );
  };

  const handleConfirmReject = () => {
    if (!rejectingLeave || !rejectionNote) return;
    setLeaveRequests(
      leaveRequests.map((l) =>
        l.id === rejectingLeave.id
          ? { ...l, status: "Rejected", rejection_reason: rejectionNote, approved_by: "Rajesh Sharma" }
          : l
      )
    );
    setRejectingLeave(null);
    setRejectionNote("");
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const newLeave: EnterpriseLeaveRequest = {
      id: `lv-${Date.now()}`,
      employee_id: applyForm.employee_id,
      leave_type: applyForm.leave_type,
      start_date: applyForm.start_date,
      end_date: applyForm.end_date,
      days_count: 2,
      status: "Pending",
      reason: applyForm.reason,
      applied_at: new Date().toISOString().split("T")[0],
    };
    setLeaveRequests([newLeave, ...leaveRequests]);
    setIsApplyOpen(false);
  };

  const filteredLogs = attendanceLogs.filter((log) => {
    const emp = ENTERPRISE_EMPLOYEES.find((e) => e.id === log.employee_id);
    const nameStr = emp ? `${emp.first_name} ${emp.last_name} ${emp.code}`.toLowerCase() : "";
    const matchesSearch = nameStr.includes(search.toLowerCase()) || log.remarks.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 p-1">
      {/* Page Header / Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
            <span>Enterprise HRMS</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">Workforce Time & Attendance</span>
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-400" /> Attendance Register & Leave Desk
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsApplyOpen(true)}
            className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition-all"
          >
            <Plus className="h-4 w-4" /> Apply For Leave
          </button>
        </div>
      </div>

      {/* Executive Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Today&apos;s Presence</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-100">{attendanceRate}%</span>
              <span className="text-xs text-emerald-400 font-medium">({presentCount + wfhCount}/{totalStaff} On Duty)</span>
            </div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Work From Home</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-blue-400">{wfhCount}</span>
              <span className="text-xs text-slate-400">Remote Staff</span>
            </div>
          </div>
          <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <Laptop className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Late Arrivals (Grace 15m)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-amber-400">{lateCount}</span>
              <span className="text-xs text-amber-500/80 font-medium">Flagged Shifts</span>
            </div>
          </div>
          <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Pending Leave Approvals</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-100">{leaveRequests.filter((l) => l.status === "Pending").length}</span>
              <span className="text-xs text-slate-400">Manager Desk</span>
            </div>
          </div>
          <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
            <Umbrella className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-1">
        <button
          onClick={() => setActiveTab("register")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition-all",
            activeTab === "register"
              ? "bg-brand-500/15 text-brand-400 border border-brand-500/30"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Daily Shift Register ({filteredLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition-all",
            activeTab === "calendar"
              ? "bg-brand-500/15 text-brand-400 border border-brand-500/30"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Monthly Attendance Heatmap
        </button>
        <button
          onClick={() => setActiveTab("leave_desk")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition-all",
            activeTab === "leave_desk"
              ? "bg-brand-500/15 text-brand-400 border border-brand-500/30"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Leave Approvals Queue ({leaveRequests.filter((l) => l.status === "Pending").length})
        </button>
      </div>

      {/* 1. REGISTER TAB */}
      {activeTab === "register" && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search staff name or remarks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-foreground focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="work from home">Work From Home</option>
                <option value="on leave">On Leave</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-muted-foreground font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Employee Staff</th>
                    <th className="p-3.5">Shift Status</th>
                    <th className="p-3.5">Punch In</th>
                    <th className="p-3.5">Punch Out</th>
                    <th className="p-3.5">Effective Hours</th>
                    <th className="p-3.5">Shift Flags</th>
                    <th className="p-3.5">Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredLogs.map((log) => {
                    const emp = ENTERPRISE_EMPLOYEES.find((e) => e.id === log.employee_id);
                    if (!emp) return null;
                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img src={emp.avatar} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-800" />
                            <div>
                              <span className="font-bold text-slate-100 block">{emp.first_name} {emp.last_name}</span>
                              <span className="text-[10px] text-slate-400">{emp.code} • {emp.designation}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit",
                              log.status === "Present" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                              log.status === "Work From Home" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                              log.status === "On Leave" && "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            )}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300 font-semibold">{log.check_in}</td>
                        <td className="p-3.5 font-mono text-slate-300 font-semibold">{log.check_out}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100 text-xs">{log.working_hours} hrs</span>
                            {log.overtime_hours > 0 && (
                              <span className="text-[10px] bg-amber-500/15 text-amber-400 px-1.5 py-0.2 rounded font-semibold">
                                +{log.overtime_hours}h OT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 space-x-1">
                          {log.is_late && (
                            <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold">
                              Late Arrival
                            </span>
                          )}
                          {log.is_early_exit && (
                            <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                              Early Exit
                            </span>
                          )}
                          {!log.is_late && !log.is_early_exit && log.status === "Present" && (
                            <span className="text-[10px] text-slate-500 font-medium">On Time</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-400 text-xs italic max-w-xs truncate">{log.remarks}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. CALENDAR HEATMAP TAB */}
      {activeTab === "calendar" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Monthly Workforce Attendance Heatmap</h3>
              <span className="text-xs text-slate-400">June 2026 Shift Density View</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium"><span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Present</span>
              <span className="flex items-center gap-1.5 text-blue-400 font-medium"><span className="h-2.5 w-2.5 rounded bg-blue-500" /> WFH</span>
              <span className="flex items-center gap-1.5 text-purple-400 font-medium"><span className="h-2.5 w-2.5 rounded bg-purple-500" /> Leave</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2 font-bold text-slate-400 uppercase text-[10px]">{day}</div>
            ))}
            {Array.from({ length: 30 }).map((_, i) => {
              const dayNum = i + 1;
              const isWeekend = i % 7 === 0 || i % 7 === 6;
              return (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-lg border border-slate-800/80 flex flex-col items-center justify-center min-h-[64px] transition-all",
                    isWeekend ? "bg-slate-950/40 text-slate-600 border-slate-900" : "bg-slate-950/80 hover:bg-slate-800/40 text-slate-200"
                  )}
                >
                  <span className="text-xs font-bold mb-1">{dayNum}</span>
                  {!isWeekend && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                      100% On Duty
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. LEAVE APPROVALS TAB */}
      {activeTab === "leave_desk" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-100">Leave Approvals Queue</h3>
            <div className="space-y-3">
              {leaveRequests.map((l) => {
                const emp = ENTERPRISE_EMPLOYEES.find((e) => e.id === l.employee_id);
                if (!emp) return null;
                return (
                  <div key={l.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img src={emp.avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-800" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-100">{emp.first_name} {emp.last_name}</h4>
                          <span className="text-[10px] text-slate-400">{emp.designation}</span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                          l.status === "Approved" && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                          l.status === "Pending" && "bg-amber-500/15 text-amber-400 border-amber-500/30",
                          l.status === "Rejected" && "bg-red-500/15 text-red-400 border-red-500/30"
                        )}
                      >
                        {l.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Leave Type</span>
                        <span className="font-semibold text-slate-200">{l.leave_type}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Duration</span>
                        <span className="font-semibold text-slate-200">{l.start_date} to {l.end_date} ({l.days_count}d)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Reason</span>
                        <span className="font-medium text-slate-300 truncate block">{l.reason}</span>
                      </div>
                    </div>

                    {l.status === "Pending" && (
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setRejectingLeave(l)}
                          className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs font-semibold border border-red-500/20"
                        >
                          Reject Request
                        </button>
                        <button
                          onClick={() => handleApproveLeave(l.id)}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-semibold shadow-sm"
                        >
                          Approve Leave
                        </button>
                      </div>
                    )}
                    {l.rejection_reason && (
                      <div className="text-[11px] text-red-400/90 bg-red-500/10 p-2 rounded border border-red-500/20 font-medium">
                        Rejection Note: {l.rejection_reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 h-fit shadow-sm">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Award className="h-4 w-4 text-brand-400" /> Employee Leave Quota Balances
            </h3>
            <div className="space-y-3">
              {ENTERPRISE_EMPLOYEES.slice(0, 3).map((emp) => {
                const bal = ENTERPRISE_LEAVE_BALANCES[emp.id];
                if (!bal) return null;
                return (
                  <div key={emp.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2 text-xs">
                    <span className="font-bold text-slate-200 block">{emp.first_name} {emp.last_name}</span>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="bg-slate-900 p-1.5 rounded">
                        <span className="text-slate-400 block">Casual</span>
                        <span className="font-bold text-emerald-400">{bal.casual_total - bal.casual_used} left</span>
                      </div>
                      <div className="bg-slate-900 p-1.5 rounded">
                        <span className="text-slate-400 block">Sick</span>
                        <span className="font-bold text-blue-400">{bal.sick_total - bal.sick_used} left</span>
                      </div>
                      <div className="bg-slate-900 p-1.5 rounded">
                        <span className="text-slate-400 block">Earned</span>
                        <span className="font-bold text-purple-400">{bal.earned_total - bal.earned_used} left</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingLeave && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 text-red-400">Reject Leave Application</h3>
              <button onClick={() => setRejectingLeave(null)} className="text-slate-400 hover:text-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-slate-300">Please provide a mandatory reason for rejecting this leave application.</p>
              <textarea
                rows={3}
                required
                placeholder="e.g. Critical milestone delivery scheduled during this period..."
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-red-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setRejectingLeave(null)} className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded font-semibold">
                  Cancel
                </button>
                <button onClick={handleConfirmReject} className="px-4 py-1.5 bg-red-500 text-white rounded font-semibold shadow-md">
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLY LEAVE MODAL */}
      {isApplyOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Submit Leave Request</h3>
              <button onClick={() => setIsApplyOpen(false)} className="text-slate-400 hover:text-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleApplyLeave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Leave Type</label>
                <select
                  value={applyForm.leave_type}
                  onChange={(e) => setApplyForm({ ...applyForm, leave_type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Earned Leave">Earned Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Start Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.start_date}
                    onChange={(e) => setApplyForm({ ...applyForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">End Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.end_date}
                    onChange={(e) => setApplyForm({ ...applyForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Reason</label>
                <textarea
                  rows={2}
                  required
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsApplyOpen(false)} className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold shadow-md shadow-brand-500/20">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
