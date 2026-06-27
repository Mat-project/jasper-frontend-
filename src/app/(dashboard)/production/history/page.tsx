"use client";

import { useState, useEffect } from "react";
import { mockService } from "@/lib/api/mockService";
import { ProductionEntry } from "@/types/production";
import { Project } from "@/types/projects";
import { User } from "@/types/user";
import {
  History,
  Search,
  SlidersHorizontal,
  Calendar,
  Layers,
  Sparkles,
  Sheet,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductionHistoryPage() {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProj, setSelectedProj] = useState("all");
  const [selectedEmp, setSelectedEmp] = useState("all");

  useEffect(() => {
    setEntries(mockService.getProductionEntries().filter((e) => e.status === "Approved"));
    setProjects(mockService.getProjects());
    setEmployees(mockService.getEmployees());
  }, []);

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.full_name : "Unknown Employee";
  };

  const getProjectCode = (id: string) => {
    const p = projects.find((proj) => proj.id === id);
    return p ? p.code : "—";
  };

  const getProjectName = (id: string) => {
    const p = projects.find((proj) => proj.id === id);
    return p ? p.name : "Unknown";
  };

  const filteredEntries = entries.filter((e) => {
    const draftsman = getEmployeeName(e.employee_id).toLowerCase();
    const proj = getProjectName(e.project_id).toLowerCase();
    const remarks = (e.remarks || "").toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = draftsman.includes(query) || proj.includes(query) || remarks.includes(query);
    const matchesProj = selectedProj === "all" || e.project_id === selectedProj;
    const matchesEmp = selectedEmp === "all" || e.employee_id === selectedEmp;

    return matchesSearch && matchesProj && matchesEmp;
  });

  // Calculate Productivity KPIs (from filtered logs)
  const totalSheets = filteredEntries.reduce((sum, e) => sum + e.quantity, 0);
  const totalTonnage = filteredEntries.reduce((sum, e) => sum + e.tonnage, 0);
  const averageTonnagePerSheet = totalSheets > 0 ? (totalTonnage / totalSheets).toFixed(2) : "0.00";
  const activeStaffCount = new Set(filteredEntries.map((e) => e.employee_id)).size;

  // Render SVG Productivity chart data
  // Group tonnage/drawings by date for the last 5 logs
  const dailyDataMap: Record<string, { sheets: number; tonnage: number }> = {};
  filteredEntries.slice(0, 10).forEach((e) => {
    if (!dailyDataMap[e.date]) {
      dailyDataMap[e.date] = { sheets: 0, tonnage: 0 };
    }
    dailyDataMap[e.date].sheets += e.quantity;
    dailyDataMap[e.date].tonnage += e.tonnage;
  });

  const chartData = Object.entries(dailyDataMap)
    .map(([date, val]) => ({ date, ...val }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-5); // last 5 days

  const maxTonnageVal = Math.max(...chartData.map((d) => d.tonnage), 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Production History & KPIs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Historical overview of all approved drawing logs, engineering outputs, and individual metric graphs.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sheets Approved", value: `${totalSheets} Drawings`, icon: Sheet, color: "text-brand-400 bg-brand-500/10" },
          { label: "Total Detailing Tonnage", value: `${totalTonnage.toFixed(1)} MT`, icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10" },
          { label: "Avg Tonnage per Sheet", value: `${averageTonnagePerSheet} MT`, icon: Sparkles, color: "text-amber-400 bg-amber-500/10" },
          { label: "Draftsman Submitting", value: `${activeStaffCount} Staff`, icon: Layers, color: "text-purple-400 bg-purple-500/10" },
        ].map((card, idx) => (
          <div key={idx} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className={cn("p-3 rounded-lg shrink-0", card.color)}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">{card.label}</span>
              <span className="text-xl font-bold text-foreground mt-1 block">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Charts & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive SVGs */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <TrendingUp className="h-5 w-5 text-brand-400" />
            <h3 className="text-sm font-bold text-foreground">Detailing Trend (Tonnage)</h3>
          </div>

          {chartData.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No historical trend data available.
            </div>
          ) : (
            <div className="space-y-6">
              {/* SVG Column Chart */}
              <div className="relative h-48 w-full flex items-end justify-between pt-6 border-b border-border/80">
                {chartData.map((d, i) => {
                  const heightPercent = Math.min((d.tonnage / maxTonnageVal) * 80, 80); // cap height
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 group relative flex-1">
                      {/* Tooltip */}
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-[10px] text-white px-2 py-0.5 rounded shadow">
                        {d.tonnage.toFixed(1)} MT
                      </div>
                      <div
                        style={{ height: `${heightPercent || 5}%` }}
                        className="w-8 bg-brand-500 rounded-t group-hover:bg-brand-400 transition-colors"
                      />
                      <span className="text-[10px] text-muted-foreground truncate w-12 text-center font-mono">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend details */}
              <div className="space-y-2">
                {chartData.map((d, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-mono">{d.date}</span>
                    <span className="text-foreground font-semibold">
                      {d.sheets} sheets — {d.tonnage.toFixed(1)} MT
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline List */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-brand-400" />
                <h3 className="text-sm font-bold text-foreground">Timeline Log</h3>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedProj}
                  onChange={(e) => setSelectedProj(e.target.value)}
                  className="px-2 py-1 bg-background border border-input rounded text-xs text-foreground focus:outline-none"
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedEmp}
                  onChange={(e) => setSelectedEmp(e.target.value)}
                  className="px-2 py-1 bg-background border border-input rounded text-xs text-foreground focus:outline-none"
                >
                  <option value="all">All Staff</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {filteredEntries.length === 0 ? (
                <div className="py-16 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No approved production logs match the filters.
                </div>
              ) : (
                filteredEntries.map((e) => (
                  <div
                    key={e.id}
                    className="relative pl-6 border-l border-border hover:bg-slate-500/5 p-3 rounded-r-lg transition-colors"
                  >
                    {/* Circle bullet */}
                    <div className="absolute -left-1.5 top-5 h-3 w-3 rounded-full bg-brand-500" />

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {e.date}
                        </div>
                        <h4 className="text-sm font-bold text-foreground mt-1">
                          {getEmployeeName(e.employee_id)} logged {e.quantity} Sheets for{" "}
                          <span className="text-brand-400">{getProjectCode(e.project_id)}</span>
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">{e.remarks || "No remarks provided"}</p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-400 shrink-0">+{e.tonnage} Tons</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
