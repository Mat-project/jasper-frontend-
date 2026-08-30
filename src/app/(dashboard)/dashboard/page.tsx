"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { getAdminDashboard, getManagerDashboard, getEmployeeDashboard } from "@/lib/api/dashboard";
import { Users, FolderKanban, Factory, Clock, AlertCircle, TrendingUp, DollarSign, Activity, FileText, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Check roles helper
  const hasRole = (roleName: string) => {
    return user?.roles.some(r => r.name.toLowerCase() === roleName.toLowerCase()) || false;
  };

  const isAdminRole = () => {
    return (
      hasRole("System Admin") ||
      hasRole("Managing Director") ||
      hasRole("Operations Manager") ||
      hasRole("Technical Manager") ||
      hasRole("Admin")
    );
  };

  const isManagerRole = () => {
    return (
      hasRole("Project Manager") ||
      hasRole("Section Manager") ||
      hasRole("Assistant Section Manager") ||
      hasRole("Manager")
    );
  };

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        let data;
        if (isAdminRole()) {
          data = await getAdminDashboard();
        } else if (isManagerRole()) {
          data = await getManagerDashboard();
        } else {
          data = await getEmployeeDashboard();
        }
        setDashboardData(data);
      } catch (err: any) {
        console.error("Dashboard load failed:", err);
        setError("Unable to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading operation analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center space-y-3 max-w-md mx-auto mt-12">
        <AlertCircle className="text-destructive h-10 w-10 mx-auto" />
        <h3 className="font-bold text-foreground">Failed to Load Dashboard</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Render Admin Dashboard
  if (isAdminRole() && dashboardData) {
    const { kpis, production_summary, billing_summary, charts } = dashboardData;
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Admin Console</h1>
          <p className="text-sm text-muted-foreground mt-1">Centralized operational health, Detailing summaries & Billing status.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Team Staff", value: kpis.total_employees ?? 0, icon: Users, color: "text-brand-400 bg-brand-500/10" },
            { label: "Active Projects", value: kpis.active_projects ?? 0, icon: FolderKanban, color: "text-emerald-400 bg-emerald-500/10" },
            { label: "Total Submissions", value: kpis.total_submissions ?? kpis.active_projects ?? 0, icon: FileText, color: "text-purple-400 bg-purple-500/10" },
            { label: "Approvals Pending", value: kpis.pending_approvals?.total ?? 0, icon: AlertCircle, color: "text-amber-400 bg-amber-500/10" },
          ].map((card, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{card.label}</span>
                <div className="text-3xl font-bold text-foreground mt-1">{card.value}</div>
              </div>
              <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center shrink-0", card.color)}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Chart */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-brand-400 h-5 w-5" />
                  <h3 className="text-sm font-bold text-foreground">Monthly Detailing Production (Tonnage)</h3>
                </div>
              </div>
              <div className="relative h-48 w-full flex items-end justify-between pt-6 border-b border-border/80">
                {(charts?.monthly_production || []).map((d: any, i: number) => {
                  const maxTons = Math.max(...(charts?.monthly_production || []).map((x: any) => x.tonnage), 10);
                  const heightPercent = Math.min((d.tonnage / maxTons) * 80, 80);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5 flex-1 relative group">
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-[10px] text-white px-2 py-0.5 rounded shadow whitespace-nowrap">{d.tonnage} MT</div>
                      <div style={{ height: `${heightPercent || 5}%` }} className="w-8 bg-gradient-to-t from-brand-600 to-brand-400 rounded-t group-hover:from-brand-500 group-hover:to-brand-300 transition-all duration-150" />
                      <span className="text-[10px] text-muted-foreground font-mono mt-1 rotate-12">{d.month.slice(0, 3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Production Output (Current Month)</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-foreground">{production_summary?.total_tonnage ?? 0} MT</span>
                    <p className="text-[11px] text-muted-foreground">Total Tonnage Approved</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Factory className="text-emerald-400 h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Operational Health</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xl font-bold text-emerald-400">100%</span>
                    <p className="text-[10px] text-muted-foreground">API Status</p>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-brand-400">Active</span>
                    <p className="text-[10px] text-muted-foreground">AI Engine</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Operational Actions</h3>
            <div className="space-y-3">
              <Link href="/projects" className="flex items-center gap-3 p-3 rounded-lg border border-border bg-slate-500/5 hover:bg-slate-500/10 transition-colors">
                <FolderKanban className="text-brand-400 h-5 w-5" />
                <div>
                  <div className="text-xs font-bold">Projects Workspace</div>
                  <span className="text-[10px] text-muted-foreground">Upload ZIPs & review registers</span>
                </div>
              </Link>
              <Link href="/admin/settings" className="flex items-center gap-3 p-3 rounded-lg border border-border bg-slate-500/5 hover:bg-slate-500/10 transition-colors">
                <DollarSign className="text-purple-400 h-5 w-5" />
                <div>
                  <div className="text-xs font-bold">Manage System Settings</div>
                  <span className="text-[10px] text-muted-foreground">Configure identity & preferences</span>
                </div>
              </Link>
              <Link href="/admin/audit-logs" className="flex items-center gap-3 p-3 rounded-lg border border-border bg-slate-500/5 hover:bg-slate-500/10 transition-colors">
                <FileText className="text-amber-400 h-5 w-5" />
                <div>
                  <div className="text-xs font-bold">Audit Trail Logs</div>
                  <span className="text-[10px] text-muted-foreground">Verify user actions & DB logs</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Manager Dashboard
  if (isManagerRole() && dashboardData) {
    const { kpis, team_attendance_summary } = dashboardData;
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Manager Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Operation metrics and productivity for assigned project teams.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Team Members", value: kpis.team_size, icon: Users, color: "text-brand-400 bg-brand-500/10" },
            { label: "Today Clocked-In", value: kpis.team_present_today, icon: Clock, color: "text-purple-400 bg-purple-500/10" },
            { label: "Productivity Score", value: kpis.team_productivity_score, icon: Activity, color: "text-emerald-400 bg-emerald-500/10" },
            { label: "Awaiting Review", value: kpis.pending_production_approvals + kpis.pending_document_approvals, icon: AlertCircle, color: "text-amber-400 bg-amber-500/10" },
          ].map((card, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card/60 backdrop-blur-md p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{card.label}</span>
                <div className="text-3xl font-bold text-foreground mt-1">{card.value}</div>
              </div>
              <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center shrink-0", card.color)}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Attendance Rate */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 lg:col-span-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="text-emerald-400 h-5 w-5" />
              Team Shift Health
            </h3>
            <div className="flex items-center gap-6 py-6">
              <div className="h-28 w-28 rounded-full border-8 border-purple-500/10 border-t-purple-500 flex items-center justify-center">
                <span className="text-xl font-bold text-foreground">
                  {kpis.team_size > 0 ? Math.round((kpis.team_present_today / kpis.team_size) * 100) : 0}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="text-xs text-muted-foreground">{team_attendance_summary.present} Clocked-In</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-slate-700" />
                  <span className="text-xs text-muted-foreground">{team_attendance_summary.absent} Away</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tasks */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Manager Reviews</h3>
            <div className="space-y-3">
              <Link href="/production/approval" className="flex items-center justify-between p-3 rounded-lg border border-border bg-slate-500/5 hover:bg-slate-500/10 transition-colors">
                <div>
                  <div className="text-xs font-bold">Approve Detailing Logs</div>
                  <span className="text-[10px] text-muted-foreground">{kpis.pending_production_approvals} logs submitted</span>
                </div>
                <div className="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded border border-amber-500/30">Review</div>
              </Link>
              <Link href="/documents" className="flex items-center justify-between p-3 rounded-lg border border-border bg-slate-500/5 hover:bg-slate-500/10 transition-colors">
                <div>
                  <div className="text-xs font-bold">Document Approvals</div>
                  <span className="text-[10px] text-muted-foreground">{kpis.pending_document_approvals} reviews assigned</span>
                </div>
                <div className="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded border border-amber-500/30">Review</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Employee Dashboard
  if (dashboardData) {
    const { today_attendance, assigned_projects, production_summary, recent_documents } = dashboardData;
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Welcome back, {user?.full_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">Here is your shift health and project status for today.</p>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
            <Clock className="text-brand-400 h-5 w-5" />
            <div>
              <div className="text-xs text-muted-foreground uppercase">Shift status</div>
              <div className="text-xs font-bold text-foreground">{today_attendance.status}</div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Assigned Projects", value: assigned_projects.length, icon: FolderKanban, color: "text-emerald-400 bg-emerald-500/10" },
            { label: "Total Sheets Detailing", value: production_summary.total_quantity, icon: Factory, color: "text-brand-400 bg-brand-500/10" },
            { label: "Total Approved Tonnage", value: `${production_summary.total_tonnage} MT`, icon: Activity, color: "text-purple-400 bg-purple-500/10" },
          ].map((card, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{card.label}</span>
                <div className="text-2xl font-bold text-foreground mt-1">{card.value}</div>
              </div>
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", card.color)}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>

        {/* Assigned Projects & Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Assigned Projects</h3>
            <div className="space-y-2">
              {assigned_projects.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No active assignments.</div>
              ) : (
                assigned_projects.map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-500/5 border border-border">
                    <div>
                      <div className="text-xs font-bold text-foreground">{p.project_name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{p.project_code} • {p.role}</div>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">{p.allocation}%</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Documents */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3 lg:col-span-2">
            <h3 className="text-sm font-bold text-foreground">Recent Documents & Revisions</h3>
            <div className="space-y-2">
              {recent_documents.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No recent documents uploaded.</div>
              ) : (
                recent_documents.map((doc: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-500/5 border border-border">
                    <div>
                      <div className="text-xs font-bold text-foreground">{doc.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{doc.document_number} • {doc.type}</div>
                    </div>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border border-border/60", doc.status === "Approved" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400")}>{doc.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
