"use client";

import React, { useState } from "react";
import {
  FolderKanban,
  Building2,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Briefcase,
  ChevronRight,
  UserPlus,
  Calendar,
  X,
  Edit3,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import {
  ENTERPRISE_EMPLOYEES,
  ENTERPRISE_PROJECTS,
  ENTERPRISE_ASSIGNMENTS,
  EnterpriseProject,
  EnterpriseAssignment,
} from "@/data/mockEnterpriseData";
import { cn } from "@/lib/utils";

export default function EnterpriseProjectsPage() {
  const [projects, setProjects] = useState<EnterpriseProject[]>(ENTERPRISE_PROJECTS);
  const [assignments, setAssignments] = useState<EnterpriseAssignment[]>(ENTERPRISE_ASSIGNMENTS);
  const [activeTab, setActiveTab] = useState<"portfolio" | "resource_matrix" | "milestones">("portfolio");
  
  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedProj, setSelectedProj] = useState<EnterpriseProject | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    code: "",
    name: "",
    client: "",
    budget: 500000,
    start_date: "2026-07-01",
    end_date: "2026-12-31",
    priority: "High" as EnterpriseProject["priority"],
  });

  const [assignForm, setAssignForm] = useState({
    employee_id: "",
    role: "Structural Detailer" as EnterpriseAssignment["role"],
    allocation_percentage: 50,
  });

  // KPI Calculations
  const totalProjects = projects.length;
  const activeCount = projects.filter((p) => p.status === "Active").length;
  const atRiskCount = projects.filter((p) => p.status === "At Risk").length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);

  // Filtered list
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === "all" || p.priority.toLowerCase() === priorityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate workloads per employee
  const employeeWorkloads = ENTERPRISE_EMPLOYEES.map((emp) => {
    const empAssigns = assignments.filter((a) => a.employee_id === emp.id);
    const totalAlloc = empAssigns.reduce((sum, a) => sum + a.allocation_percentage, 0);
    return {
      employee: emp,
      assignments: empAssigns,
      totalAlloc,
    };
  });

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.code || !addForm.name || !addForm.client) return;
    const newProj: EnterpriseProject = {
      id: `prj-${Date.now()}`,
      code: addForm.code,
      name: addForm.name,
      client: addForm.client,
      budget: Number(addForm.budget),
      spent: 0,
      start_date: addForm.start_date,
      end_date: addForm.end_date,
      status: "Active",
      priority: addForm.priority,
      progress: 0,
      milestones: [
        { id: `m-${Date.now()}`, name: "Kickoff & Design Basis", due_date: addForm.start_date, is_completed: true },
      ],
      tasks: { total: 10, completed: 0, in_progress: 2, pending: 8 },
    };
    setProjects([newProj, ...projects]);
    setIsAddOpen(false);
    setAddForm({ code: "", name: "", client: "", budget: 500000, start_date: "2026-07-01", end_date: "2026-12-31", priority: "High" });
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProj || !assignForm.employee_id) return;
    const newAssign: EnterpriseAssignment = {
      id: `asg-${Date.now()}`,
      project_id: selectedProj.id,
      employee_id: assignForm.employee_id,
      role: assignForm.role,
      allocation_percentage: Number(assignForm.allocation_percentage),
      assigned_date: new Date().toISOString().split("T")[0],
    };
    setAssignments([...assignments, newAssign]);
    setIsAssignOpen(false);
    setAssignForm({ employee_id: "", role: "Structural Detailer", allocation_percentage: 50 });
  };

  const handleToggleMilestone = (projId: string, milestoneId: string) => {
    setProjects(
      projects.map((p) => {
        if (p.id === projId) {
          const updatedMilestones = p.milestones.map((m) =>
            m.id === milestoneId ? { ...m, is_completed: !m.is_completed } : m
          );
          return { ...p, milestones: updatedMilestones };
        }
        return p;
      })
    );
  };

  return (
    <div className="space-y-5 p-1">
      {/* Page Header / Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
            <span>Enterprise HRMS</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">Project Management Portfolio</span>
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-brand-400" /> Projects & Resource Capacity Matrix
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition-all"
          >
            <Plus className="h-4 w-4" /> Create Project
          </button>
        </div>
      </div>

      {/* Executive Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Active Portfolio</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-100">{activeCount}</span>
              <span className="text-xs text-slate-400">/ {totalProjects} Projects</span>
            </div>
          </div>
          <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Schedule Risk</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-amber-400">{atRiskCount}</span>
              <span className="text-xs text-amber-500/80 font-semibold">Delayed/At Risk</span>
            </div>
          </div>
          <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Total Portfolio Budget</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-100">${(totalBudget / 1000000).toFixed(2)}M</span>
              <span className="text-xs text-emerald-400 font-medium">Approved</span>
            </div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Budget Utilization</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-100">{Math.round((totalSpent / totalBudget) * 100)}%</span>
              <span className="text-xs text-slate-400">${(totalSpent / 1000).toFixed(0)}k spent</span>
            </div>
          </div>
          <div className="p-2.5 bg-brand-500/10 rounded-lg text-brand-400 border border-brand-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-1">
        <button
          onClick={() => setActiveTab("portfolio")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition-all",
            activeTab === "portfolio"
              ? "bg-brand-500/15 text-brand-400 border border-brand-500/30"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Project Portfolio ({filteredProjects.length})
        </button>
        <button
          onClick={() => setActiveTab("resource_matrix")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition-all",
            activeTab === "resource_matrix"
              ? "bg-brand-500/15 text-brand-400 border border-brand-500/30"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Draftsmen Workload & Capacity Matrix
        </button>
        <button
          onClick={() => setActiveTab("milestones")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition-all",
            activeTab === "milestones"
              ? "bg-brand-500/15 text-brand-400 border border-brand-500/30"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Milestones & Critical Checklist
        </button>
      </div>

      {/* 1. PORTFOLIO TAB */}
      {activeTab === "portfolio" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search code, project, or client..."
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
                <option value="active">Active</option>
                <option value="at risk">At Risk</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-foreground focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-muted-foreground font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Code & Project</th>
                    <th className="p-3.5">Client</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Budget Burn</th>
                    <th className="p-3.5">Progress</th>
                    <th className="p-3.5">Assigned Team</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredProjects.map((p) => {
                    const projAssigns = assignments.filter((a) => a.project_id === p.id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono text-[10px] text-brand-400 font-bold bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20 block w-fit mb-0.5">
                            {p.code}
                          </span>
                          <span className="font-semibold text-slate-100 block">{p.name}</span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-slate-500" />
                            {p.client}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              p.priority === "Critical" && "bg-red-500/10 text-red-400 border-red-500/20",
                              p.priority === "High" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                              p.priority === "Medium" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                              p.priority === "Low" && "bg-slate-500/10 text-slate-400 border-slate-500/20"
                            )}
                          >
                            {p.priority}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit",
                              p.status === "Active" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                              p.status === "At Risk" && "bg-red-500/10 text-red-400 border-red-500/20",
                              p.status === "Completed" && "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            )}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="space-y-1 w-32">
                            <div className="flex justify-between text-[10px] font-medium text-slate-400">
                              <span>${(p.spent / 1000).toFixed(0)}k</span>
                              <span>${(p.budget / 1000).toFixed(0)}k</span>
                            </div>
                            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  p.spent > p.budget ? "bg-red-500" : "bg-brand-500"
                                )}
                                style={{ width: `${Math.min(100, (p.spent / p.budget) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200 text-xs w-8">{p.progress}%</span>
                            <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.progress}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center -space-x-2 overflow-hidden">
                            {projAssigns.map((asg) => {
                              const emp = ENTERPRISE_EMPLOYEES.find((e) => e.id === asg.employee_id);
                              if (!emp) return null;
                              return (
                                <img
                                  key={asg.id}
                                  src={emp.avatar}
                                  alt={emp.first_name}
                                  title={`${emp.first_name} (${asg.role}) - ${asg.allocation_percentage}%`}
                                  className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 object-cover"
                                />
                              );
                            })}
                            {projAssigns.length === 0 && <span className="text-slate-500 text-[10px]">Unassigned</span>}
                          </div>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedProj(p);
                              setIsAssignOpen(true);
                            }}
                            className="px-2.5 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 rounded text-[11px] font-semibold transition-colors border border-brand-500/20"
                          >
                            + Team
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. RESOURCE CAPACITY MATRIX TAB */}
      {activeTab === "resource_matrix" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Draftsmen & Engineer Capacity Matrix</h3>
              <p className="text-xs text-slate-400">Calculated workload allocation based on active engineering project assignments.</p>
            </div>
            <div className="space-y-3.5">
              {employeeWorkloads.map(({ employee, totalAlloc, assignments: empAssigns }) => (
                <div key={employee.id} className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={employee.avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-800" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">{employee.first_name} {employee.last_name}</h4>
                        <span className="text-[10px] text-slate-400 block">{employee.designation} • {employee.department}</span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold border",
                        totalAlloc > 100 && "bg-red-500/15 text-red-400 border-red-500/30 animate-pulse",
                        totalAlloc === 100 && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                        totalAlloc < 100 && totalAlloc > 0 && "bg-blue-500/15 text-blue-400 border-blue-500/30",
                        totalAlloc === 0 && "bg-slate-800 text-slate-400 border-slate-700"
                      )}
                    >
                      {totalAlloc}% Allocated {totalAlloc > 100 && "(OVERLOAD)"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          totalAlloc > 100 ? "bg-red-500" : "bg-brand-500"
                        )}
                        style={{ width: `${Math.min(100, totalAlloc)}%` }}
                      />
                    </div>
                  </div>

                  {/* Active assignments pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {empAssigns.map((asg) => {
                      const proj = projects.find((p) => p.id === asg.project_id);
                      return (
                        <span key={asg.id} className="text-[10px] px-2 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded-md flex items-center gap-1 font-medium">
                          <span className="text-brand-400 font-bold">{proj?.code}</span>
                          <span>({asg.role} - {asg.allocation_percentage}%)</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 h-fit shadow-sm">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-400" /> Resource Bench Overview
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Available Capacity</span>
                <span className="text-lg font-bold text-emerald-400">
                  {employeeWorkloads.filter((w) => w.totalAlloc < 100).length} Engineers
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Available to take on new steel detailing or BIM modeling tasks.</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Over-Allocated Warnings</span>
                <span className="text-lg font-bold text-red-400">
                  {employeeWorkloads.filter((w) => w.totalAlloc > 100).length} Engineers
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Require workload re-balancing to prevent burnout.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MILESTONES TAB */}
      {activeTab === "milestones" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <div key={proj.id} className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 shadow-sm">
              <div className="flex justify-between items-start border-b border-slate-800 pb-2.5">
                <div>
                  <span className="text-[10px] font-bold text-brand-400 font-mono">{proj.code}</span>
                  <h4 className="text-sm font-bold text-slate-100">{proj.name}</h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-300 font-semibold">
                  {proj.tasks.completed}/{proj.tasks.total} Tasks Completed
                </span>
              </div>
              <div className="space-y-2">
                {proj.milestones.map((m) => (
                  <label key={m.id} className="flex items-center justify-between p-2.5 bg-slate-950/60 hover:bg-slate-950 rounded-lg cursor-pointer border border-slate-800/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={m.is_completed}
                        onChange={() => handleToggleMilestone(proj.id, m.id)}
                        className="rounded border-slate-700 text-brand-500 focus:ring-brand-500 bg-slate-900 h-4 w-4"
                      />
                      <span className={cn("text-xs font-medium", m.is_completed ? "line-through text-slate-500" : "text-slate-200")}>
                        {m.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {m.due_date}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-brand-400" /> Create New Engineering Project
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddProject} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Project Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PRJ-DEL-10"
                    value={addForm.code}
                    onChange={(e) => setAddForm({ ...addForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Client Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. L&T Heavy Eng."
                    value={addForm.client}
                    onChange={(e) => setAddForm({ ...addForm, client: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai Metro Line 4 Viaducts"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Approved Budget ($)</label>
                  <input
                    type="number"
                    required
                    value={addForm.budget}
                    onChange={(e) => setAddForm({ ...addForm, budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Priority</label>
                  <select
                    value={addForm.priority}
                    onChange={(e) => setAddForm({ ...addForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-brand-500 focus:outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold shadow-md shadow-brand-500/20">
                  Save & Launch Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN STAFF MODAL */}
      {isAssignOpen && selectedProj && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Assign Engineer to {selectedProj.code}</h3>
                <span className="text-[10px] text-slate-400">{selectedProj.name}</span>
              </div>
              <button onClick={() => setIsAssignOpen(false)} className="text-slate-400 hover:text-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Select Employee</label>
                <select
                  required
                  value={assignForm.employee_id}
                  onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">-- Choose Staff Member --</option>
                  {ENTERPRISE_EMPLOYEES.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Project Role</label>
                  <select
                    value={assignForm.role}
                    onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-brand-500 focus:outline-none"
                  >
                    <option value="Lead Engineer">Lead Engineer</option>
                    <option value="BIM Specialist">BIM Specialist</option>
                    <option value="Structural Detailer">Structural Detailer</option>
                    <option value="Checker">Checker</option>
                    <option value="Modeler">Modeler</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Allocation (%)</label>
                  <select
                    value={assignForm.allocation_percentage}
                    onChange={(e) => setAssignForm({ ...assignForm, allocation_percentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-brand-500 focus:outline-none"
                  >
                    <option value={25}>25% Capacity</option>
                    <option value={50}>50% Capacity</option>
                    <option value={75}>75% Capacity</option>
                    <option value={100}>100% Full Time</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsAssignOpen(false)} className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold shadow-md shadow-brand-500/20">
                  Assign Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
