"use client";

import { useState, useEffect } from "react";
import { mockService } from "@/lib/api/mockService";
import { Project } from "@/types/projects";
import { User } from "@/types/user";
import { ProductionEntry } from "@/types/production";
import { AttendanceRecord } from "@/types/attendance";
import {
  Users,
  FolderKanban,
  Factory,
  CheckSquare,
  TrendingUp,
  Clock,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [production, setProduction] = useState<ProductionEntry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [pendingDocsCount, setPendingDocsCount] = useState(0);

  useEffect(() => {
    setEmployees(mockService.getEmployees());
    setProjects(mockService.getProjects());
    setProduction(mockService.getProductionEntries());
    setAttendance(mockService.getAttendance());
    setPendingLeavesCount(mockService.getLeaveRequests().filter((r) => r.status === "Pending").length);
    setPendingDocsCount(mockService.getDocuments().filter((d) => d.status === "Pending").length);
  }, []);

  // Calculate stats
  const totalEmployees = employees.length;
  const activeProjects = projects.filter((p) => p.status === "In Progress").length;
  
  // Total Tonnage Approved
  const totalTonnageApproved = production
    .filter((e) => e.status === "Approved")
    .reduce((sum, e) => sum + e.tonnage, 0);

  // Latest Attendance rate
  const latestDate = attendance.length > 0 ? attendance[attendance.length - 1].date : "";
  const latestAttendance = attendance.filter((r) => r.date === latestDate);
  const presentCount = latestAttendance.filter((r) => r.status === "Present" || r.status === "Half Day").length;
  const attendanceRate = latestAttendance.length > 0 ? Math.round((presentCount / latestAttendance.length) * 100) : 0;

  // Pending production logs count
  const pendingProdCount = production.filter((e) => e.status === "Submitted").length;

  const totalPendingApprovals = pendingLeavesCount + pendingDocsCount + pendingProdCount;

  // SVG Chart: Last 5 days of production tonnage
  const dailyProductionMap: Record<string, number> = {};
  production
    .filter((e) => e.status === "Approved")
    .slice(0, 10)
    .forEach((e) => {
      dailyProductionMap[e.date] = (dailyProductionMap[e.date] || 0) + e.tonnage;
    });

  const prodTrendData = Object.entries(dailyProductionMap)
    .map(([date, tonnage]) => ({ date, tonnage }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-5);

  const maxProdTonnage = Math.max(...prodTrendData.map((d) => d.tonnage), 10);

  // SVG Chart: Attendance distribution for the last 5 days
  const attendanceTrendMap: Record<string, { present: number; total: number }> = {};
  attendance.forEach((r) => {
    if (!attendanceTrendMap[r.date]) {
      attendanceTrendMap[r.date] = { present: 0, total: 0 };
    }
    attendanceTrendMap[r.date].total += 1;
    if (r.status === "Present" || r.status === "Half Day") {
      attendanceTrendMap[r.date].present += 1;
    }
  });

  const attendanceTrendData = Object.entries(attendanceTrendMap)
    .map(([date, val]) => ({ date, rate: Math.round((val.present / val.total) * 100) }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Engineering Operations Management System — Operational Health Overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Employees", value: totalEmployees, icon: Users, color: "text-brand-400 bg-brand-500/10" },
          { label: "Active Projects", value: activeProjects, icon: FolderKanban, color: "text-emerald-400 bg-emerald-500/10" },
          { label: "Approved Detailing Tonnage", value: `${totalTonnageApproved.toFixed(1)} MT`, icon: Factory, color: "text-amber-400 bg-amber-500/10" },
          { label: `Attendance Rate (${latestDate || "Today"})`, value: `${attendanceRate}%`, icon: Clock, color: "text-purple-400 bg-purple-500/10" },
        ].map((card, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-150 flex items-center justify-between"
          >
            <div>
              <div className="text-sm text-muted-foreground font-semibold">{card.label}</div>
              <div className="text-2xl font-bold text-foreground mt-1">{card.value}</div>
            </div>
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", card.color)}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Pending Approvals alert banner */}
      {totalPendingApprovals > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-amber-400 h-5 w-5 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-amber-300">Approvals Awaiting Review</h4>
              <p className="text-xs text-amber-400/80 mt-0.5">
                You have <span className="font-bold text-amber-200">{totalPendingApprovals}</span> total items pending approval: 
                {" "}{pendingProdCount} production, {pendingLeavesCount} leaves, and {pendingDocsCount} documents.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/production/approval"
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-xs font-bold transition-colors shrink-0 text-center"
            >
              Review Actions
            </Link>
          </div>
        </div>
      )}

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production trend (SVG line/column chart) */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-brand-400 h-5 w-5" />
              <h3 className="text-sm font-bold text-foreground">Weekly Production Trend (Tonnage)</h3>
            </div>
          </div>

          {prodTrendData.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No recent production data logged.
            </div>
          ) : (
            <div className="relative h-44 w-full flex items-end justify-between pt-6 border-b border-border/80">
              {prodTrendData.map((d, i) => {
                const heightPercent = Math.min((d.tonnage / maxProdTonnage) * 80, 80);
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5 flex-1 relative group">
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-[9px] text-white px-1.5 py-0.5 rounded shadow">
                      {d.tonnage.toFixed(1)} MT
                    </div>
                    <div
                      style={{ height: `${heightPercent || 5}%` }}
                      className="w-7 bg-brand-500 rounded-t group-hover:bg-brand-400 transition-all duration-150"
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">{d.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attendance trend (SVG column chart) */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="text-purple-400 h-5 w-5" />
              <h3 className="text-sm font-bold text-foreground">Weekly Attendance rate (%)</h3>
            </div>
          </div>

          {attendanceTrendData.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No attendance data logged.
            </div>
          ) : (
            <div className="relative h-44 w-full flex items-end justify-between pt-6 border-b border-border/80">
              {attendanceTrendData.map((d, i) => {
                const heightPercent = d.rate * 0.8;
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5 flex-1 relative group">
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-[9px] text-white px-1.5 py-0.5 rounded shadow">
                      {d.rate}% Present
                    </div>
                    <div
                      style={{ height: `${heightPercent || 5}%` }}
                      className="w-7 bg-purple-500 rounded-t group-hover:bg-purple-400 transition-all duration-150"
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">{d.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project summaries */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3 lg:col-span-1">
          <div className="pb-2 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Projects Summary</h3>
          </div>
          <div className="space-y-2">
            {projects.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-500/5 border border-border">
                <div>
                  <div className="text-xs font-bold text-foreground">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{p.code} • {p.client}</div>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border border-border/60",
                    p.status === "In Progress" && "bg-blue-500/10 text-blue-400",
                    p.status === "Not Started" && "bg-slate-500/10 text-slate-400",
                    p.status === "Completed" && "bg-emerald-500/10 text-emerald-400"
                  )}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Approved Production summaries */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3 lg:col-span-1">
          <div className="pb-2 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Production Logs</h3>
          </div>
          <div className="space-y-2">
            {production
              .filter((e) => e.status === "Approved")
              .slice(0, 3)
              .map((e) => {
                const proj = projects.find((p) => p.id === e.project_id);
                return (
                  <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-500/5 border border-border">
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        {mockService.getEmployees().find((emp) => emp.id === e.employee_id)?.full_name || "Staff"}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        {proj?.code || "—"} • {e.quantity} Sheets
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400">+{e.tonnage} MT</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Attendance overview / latest summaries */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3 lg:col-span-1">
          <div className="pb-2 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Attendance overview</h3>
          </div>
          <div className="space-y-2">
            {latestAttendance.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-500/5 border border-border">
                <span className="text-xs font-semibold text-foreground">
                  {mockService.getEmployees().find((e) => e.id === r.employee_id)?.full_name || "Staff"}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border border-border/60",
                    r.status === "Present" && "bg-emerald-500/10 text-emerald-400",
                    r.status === "Absent" && "bg-red-500/10 text-red-400",
                    r.status === "On Leave" && "bg-purple-500/10 text-purple-400"
                  )}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
