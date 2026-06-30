"use client";

import React, { useState } from "react";
import {
  Clock,
  Users,
  CalendarDays,
  ChevronRight,
  Search,
  Filter,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Laptop,
  UserCheck,
  UserX,
  ThumbsUp,
  ThumbsDown,
  X,
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
  const [attendanceLogs] = useState<EnterpriseAttendance[]>(ENTERPRISE_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState<EnterpriseLeaveRequest[]>(ENTERPRISE_LEAVES);
  const [activeTab, setActiveTab] = useState<"register" | "heatmap" | "leave_desk">("register");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const totalStaff = ENTERPRISE_EMPLOYEES.length;
  const presentCount = attendanceLogs.filter((a) => a.status === "Present").length;
  const wfhCount = attendanceLogs.filter((a) => a.status === "Work From Home").length;
  const lateCount = attendanceLogs.filter((a) => a.is_late).length;
  const pendingLeaves = leaveRequests.filter((l) => l.status === "Pending").length;
  const attendanceRate = Math.round(((presentCount + wfhCount) / totalStaff) * 100);

  const filteredLogs = attendanceLogs.filter((a) => {
    const emp = ENTERPRISE_EMPLOYEES.find((e) => e.id === a.employee_id);
    const name = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : "";
    const matchesSearch = name.includes(search.toLowerCase()) || a.employee_id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status.toLowerCase().replace(/\s/g, "_") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApproveLeave = (id: string) => {
    setLeaveRequests(leaveRequests.map((l) => (l.id === id ? { ...l, status: "Approved" as const } : l)));
  };

  const handleRejectLeave = (id: string) => {
    if (!rejectReason.trim()) return;
    setLeaveRequests(leaveRequests.map((l) => (l.id === id ? { ...l, status: "Rejected" as const, rejection_reason: rejectReason } : l)));
    setRejectingId(null);
    setRejectReason("");
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; border: string; dot: string }> = {
      "Present": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
      "Work From Home": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
      "On Leave": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
      "Absent": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
      "Half Day": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
    };
    const s = map[status] || { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" };
    return s;
  };

  // Heatmap: Generate 30-day grid with simulated data
  const heatmapDays = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(2026, 5, i + 1);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const rate = isWeekend ? 0 : 70 + Math.floor(Math.random() * 30);
    return {
      day: i + 1,
      date: date.toLocaleDateString("en-IN", { weekday: "short" }),
      rate,
      isWeekend,
      label: `Jun ${i + 1}`,
    };
  });

  const getHeatColor = (rate: number, isWeekend: boolean) => {
    if (isWeekend) return "bg-gray-50 border-gray-100 text-gray-300";
    if (rate >= 95) return "bg-emerald-100 border-emerald-200 text-emerald-800";
    if (rate >= 85) return "bg-emerald-50 border-emerald-100 text-emerald-700";
    if (rate >= 75) return "bg-blue-50 border-blue-100 text-blue-700";
    if (rate >= 60) return "bg-amber-50 border-amber-100 text-amber-700";
    return "bg-red-50 border-red-100 text-red-700";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <span>Enterprise HRMS</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600 font-semibold">Attendance & Leave Management</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <span className="p-1.5 bg-blue-50 rounded-lg"><Clock className="h-5 w-5 text-blue-600" /></span>
            Attendance Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Monitor daily attendance, shift adherence, and leave approvals.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-slate-600 shadow-sm flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-blue-500" /> June 26, 2026
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Today\u2019s Presence",
            value: `${attendanceRate}%`,
            sub: `${presentCount + wfhCount}/${totalStaff} On Duty`,
            icon: <UserCheck className="h-5 w-5 text-emerald-600" />,
            iconBg: "bg-emerald-50",
            trend: { value: "+3.2%", positive: true },
          },
          {
            label: "Work From Home",
            value: wfhCount,
            sub: "Remote today",
            icon: <Laptop className="h-5 w-5 text-blue-600" />,
            iconBg: "bg-blue-50",
            trend: null,
          },
          {
            label: "Late Arrivals",
            value: lateCount,
            sub: "After 9:15 AM cutoff",
            icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
            iconBg: "bg-amber-50",
            trend: { value: "-1", positive: true },
          },
          {
            label: "Pending Leave Requests",
            value: pendingLeaves,
            sub: "Awaiting approval",
            icon: <UserX className="h-5 w-5 text-red-500" />,
            iconBg: "bg-red-50",
            trend: null,
          },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                {card.trend && (
                  <span className={cn("text-xs font-semibold flex items-center gap-0.5", card.trend.positive ? "text-emerald-600" : "text-red-600")}>
                    {card.trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {card.trend.value}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
            </div>
            <div className={`p-3 ${card.iconBg} rounded-xl`}>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex gap-1 p-1.5 border-b border-gray-100">
          {[
            { key: "register", label: "Shift Register" },
            { key: "heatmap", label: "Monthly Heatmap" },
            { key: "leave_desk", label: `Leave Approval Desk (${pendingLeaves})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-gray-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SHIFT REGISTER TAB */}
        {activeTab === "register" && (
          <div className="p-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="work_from_home">Work From Home</option>
                  <option value="on_leave">On Leave</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-slate-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Check In</th>
                    <th className="px-4 py-3">Check Out</th>
                    <th className="px-4 py-3">Effective Hrs</th>
                    <th className="px-4 py-3">Overtime</th>
                    <th className="px-4 py-3">Flags</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredLogs.map((log) => {
                    const emp = ENTERPRISE_EMPLOYEES.find((e) => e.id === log.employee_id);
                    if (!emp) return null;
                    const sb = statusBadge(log.status);
                    return (
                      <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img src={emp.avatar} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-100" />
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{emp.first_name} {emp.last_name}</p>
                              <p className="text-xs text-slate-400">{emp.designation}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 w-fit", sb.bg, sb.text, sb.border)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", sb.dot)} />{log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-sm text-gray-700">{log.check_in}</td>
                        <td className="px-4 py-3.5 font-mono text-sm text-gray-700">{log.check_out}</td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-gray-800">{log.working_hours > 0 ? `${log.working_hours}h` : "—"}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          {log.overtime_hours > 0 ? (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold">
                              +{log.overtime_hours}h OT
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5">
                            {log.is_late && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold uppercase">Late</span>
                            )}
                            {log.is_early_exit && (
                              <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[10px] font-bold uppercase">Early Exit</span>
                            )}
                            {!log.is_late && !log.is_early_exit && log.working_hours > 0 && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase">On Time</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 max-w-48 truncate">{log.remarks || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MONTHLY HEATMAP TAB */}
        {activeTab === "heatmap" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">June 2026 — Attendance Density</h3>
                <p className="text-sm text-slate-500">Daily attendance rate across the organization.</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-200" /> 95%+</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-50 border border-emerald-100" /> 85-94%</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blue-50 border border-blue-100" /> 75-84%</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-50 border border-amber-100" /> 60-74%</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-50 border border-red-100" /> &lt;60%</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">{d}</div>
              ))}
              {/* Offset for June 2026 starting on Monday */}
              {heatmapDays.map((day) => (
                <div
                  key={day.day}
                  className={cn(
                    "aspect-square rounded-lg border flex flex-col items-center justify-center text-center cursor-default transition-all hover:shadow-sm",
                    getHeatColor(day.rate, day.isWeekend)
                  )}
                  title={`Jun ${day.day}: ${day.isWeekend ? "Weekend" : `${day.rate}% attendance`}`}
                >
                  <span className="text-xs font-bold">{day.day}</span>
                  {!day.isWeekend && <span className="text-[9px] font-semibold">{day.rate}%</span>}
                </div>
              ))}
            </div>

            {/* Leave Balances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              {ENTERPRISE_EMPLOYEES.map((emp) => {
                const bal = ENTERPRISE_LEAVE_BALANCES[emp.id];
                if (!bal) return null;
                const leaveTypes = [
                  { label: "Casual", used: bal.casual_used, total: bal.casual_total },
                  { label: "Sick", used: bal.sick_used, total: bal.sick_total },
                  { label: "Earned", used: bal.earned_used, total: bal.earned_total },
                  { label: "Unpaid", used: bal.unpaid_used, total: 0 },
                ];
                return (
                <div key={emp.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-3">
                    <img src={emp.avatar} alt="" className="h-8 w-8 rounded-full ring-2 ring-gray-100 object-cover" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{emp.first_name}</p>
                      <p className="text-[10px] text-slate-400">{emp.designation}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {leaveTypes.map((lt) => (
                      <div key={lt.label} className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">{lt.label}</span>
                        <span className="font-bold text-gray-800">{lt.used}{lt.total > 0 ? `/${lt.total}` : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LEAVE APPROVAL DESK TAB */}
        {activeTab === "leave_desk" && (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Leave Approval Queue</h3>
              <p className="text-sm text-slate-500">Review and process pending leave requests.</p>
            </div>
            <div className="space-y-3">
              {leaveRequests.map((leave) => {
                const emp = ENTERPRISE_EMPLOYEES.find((e) => e.id === leave.employee_id);
                if (!emp) return null;
                const isPending = leave.status === "Pending";
                const leaveBg =
                  leave.status === "Approved" ? "border-emerald-200 bg-emerald-50/30" :
                  leave.status === "Rejected" ? "border-red-200 bg-red-50/30" :
                  "border-gray-200 bg-white";
                return (
                  <div key={leave.id} className={cn("border rounded-xl p-4 shadow-sm", leaveBg)}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <img src={emp.avatar} alt="" className="h-10 w-10 rounded-full ring-2 ring-gray-100 object-cover" />
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-slate-500">{emp.designation} · {emp.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Leave Type</p>
                          <p className="text-sm font-bold text-gray-900">{leave.leave_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Duration</p>
                          <p className="text-sm font-bold text-gray-900">{leave.start_date} → {leave.end_date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Days</p>
                          <p className="text-sm font-bold text-gray-900">{leave.days_count}</p>
                        </div>
                        {isPending ? (
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleApproveLeave(leave.id)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                            >
                              <ThumbsUp className="h-3 w-3" /> Approve
                            </button>
                            <button
                              onClick={() => setRejectingId(leave.id)}
                              className="px-3.5 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <ThumbsDown className="h-3 w-3" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold border",
                            leave.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {leave.status}
                          </span>
                        )}
                      </div>
                    </div>
                    {leave.reason && (
                      <p className="mt-2 text-sm text-slate-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                        <span className="font-semibold text-slate-700">Reason:</span> {leave.reason}
                      </p>
                    )}
                    {leave.rejection_reason && (
                      <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        <span className="font-semibold">Rejection Note:</span> {leave.rejection_reason}
                      </p>
                    )}

                    {/* Inline rejection reason input */}
                    {rejectingId === leave.id && (
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter rejection reason (mandatory)..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="flex-1 px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
                        />
                        <button
                          onClick={() => handleRejectLeave(leave.id)}
                          disabled={!rejectReason.trim()}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason(""); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4 text-slate-500" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
