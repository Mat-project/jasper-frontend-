"use client";

import React, { useState } from "react";
import {
  FolderKanban,
  Building2,
  DollarSign,
  Users,
  ShieldAlert,
  TrendingUp,
  Briefcase,
  ChevronRight,
  Calendar,
  X,
  Filter,
  Search,
  Plus,
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedProj, setSelectedProj] = useState<EnterpriseProject | null>(null);

  const [addForm, setAddForm] = useState({
    code: "", name: "", client: "", budget: 500000,
    start_date: "2026-07-01", end_date: "2026-12-31",
    priority: "High" as EnterpriseProject["priority"],
  });

  const [assignForm, setAssignForm] = useState({
    employee_id: "",
    role: "Structural Detailer" as EnterpriseAssignment["role"],
    allocation_percentage: 50,
  });

  const totalProjects = projects.length;
  const activeCount = projects.filter((p) => p.status === "Active").length;
  const atRiskCount = projects.filter((p) => p.status === "At Risk").length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === "all" || p.priority.toLowerCase() === priorityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const employeeWorkloads = ENTERPRISE_EMPLOYEES.map((emp) => {
    const empAssigns = assignments.filter((a) => a.employee_id === emp.id);
    const totalAlloc = empAssigns.reduce((sum, a) => sum + a.allocation_percentage, 0);
    return { employee: emp, assignments: empAssigns, totalAlloc };
  });

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.code || !addForm.name || !addForm.client) return;
    const newProj: EnterpriseProject = {
      id: `prj-${Date.now()}`, code: addForm.code, name: addForm.name,
      client: addForm.client, budget: Number(addForm.budget), spent: 0,
      start_date: addForm.start_date, end_date: addForm.end_date,
      status: "Active", priority: addForm.priority, progress: 0,
      milestones: [{ id: `m-${Date.now()}`, name: "Kickoff & Design Basis", due_date: addForm.start_date, is_completed: true }],
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
      id: `asg-${Date.now()}`, project_id: selectedProj.id,
      employee_id: assignForm.employee_id, role: assignForm.role,
      allocation_percentage: Number(assignForm.allocation_percentage),
      assigned_date: new Date().toISOString().split("T")[0],
    };
    setAssignments([...assignments, newAssign]);
    setIsAssignOpen(false);
    setAssignForm({ employee_id: "", role: "Structural Detailer", allocation_percentage: 50 });
  };

  const handleToggleMilestone = (projId: string, milestoneId: string) => {
    setProjects(projects.map((p) => {
      if (p.id === projId) {
        const updatedMilestones = p.milestones.map((m) =>
          m.id === milestoneId ? { ...m, is_completed: !m.is_completed } : m
        );
        return { ...p, milestones: updatedMilestones };
      }
      return p;
    }));
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      "Active": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "At Risk": "bg-red-50 text-red-700 border-red-200",
      "Completed": "bg-blue-50 text-blue-700 border-blue-200",
      "On Hold": "bg-amber-50 text-amber-700 border-amber-200",
      "Planned": "bg-slate-50 text-slate-600 border-slate-200",
    };
    return map[status] || "bg-gray-50 text-gray-600 border-gray-200";
  };

  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      "Critical": "bg-red-50 text-red-700 border-red-200",
      "High": "bg-orange-50 text-orange-700 border-orange-200",
      "Medium": "bg-blue-50 text-blue-700 border-blue-200",
      "Low": "bg-gray-50 text-gray-600 border-gray-200",
    };
    return map[priority] || "bg-gray-50 text-gray-600 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <span>Enterprise HRMS</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600 font-semibold">Project Management Portfolio</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <span className="p-1.5 bg-blue-50 rounded-lg"><FolderKanban className="h-5 w-5 text-blue-600" /></span>
            Projects & Resource Capacity Matrix
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track project portfolio, team allocation, and milestone delivery.</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Create Project
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Portfolio", value: activeCount, sub: `${totalProjects} total projects`, icon: <Briefcase className="h-5 w-5 text-blue-600" />, iconBg: "bg-blue-50", valueColor: "text-gray-900" },
          { label: "Schedule Risk", value: atRiskCount, sub: "Delayed / At Risk", icon: <ShieldAlert className="h-5 w-5 text-amber-500" />, iconBg: "bg-amber-50", valueColor: "text-amber-600" },
          { label: "Total Portfolio Budget", value: `$${(totalBudget / 1000000).toFixed(2)}M`, sub: "Approved commitment", icon: <DollarSign className="h-5 w-5 text-emerald-600" />, iconBg: "bg-emerald-50", valueColor: "text-gray-900" },
          { label: "Budget Utilization", value: `${Math.round((totalSpent / totalBudget) * 100)}%`, sub: `$${(totalSpent / 1000).toFixed(0)}k spent`, icon: <TrendingUp className="h-5 w-5 text-purple-600" />, iconBg: "bg-purple-50", valueColor: "text-gray-900" },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
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
            { key: "portfolio", label: `Project Portfolio (${filteredProjects.length})` },
            { key: "resource_matrix", label: "Capacity Matrix" },
            { key: "milestones", label: "Milestones" },
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

        {/* PORTFOLIO TAB */}
        {activeTab === "portfolio" && (
          <div className="p-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search project, code, or client..."
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
                  <option value="active">Active</option>
                  <option value="at risk">At Risk</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-slate-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Budget Burn</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredProjects.map((p) => {
                    const projAssigns = assignments.filter((a) => a.project_id === p.id);
                    return (
                      <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="inline-block font-mono text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded mb-0.5">
                            {p.code}
                          </span>
                          <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />{p.client}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", priorityBadge(p.priority))}>
                            {p.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 w-fit", statusBadge(p.status))}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />{p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-1 w-36">
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>${(p.spent / 1000).toFixed(0)}k</span>
                              <span>${(p.budget / 1000).toFixed(0)}k</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", p.spent > p.budget ? "bg-red-500" : "bg-blue-500")}
                                style={{ width: `${Math.min(100, (p.spent / p.budget) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 text-sm w-9">{p.progress}%</span>
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.progress}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center -space-x-2">
                            {projAssigns.map((asg) => {
                              const emp = ENTERPRISE_EMPLOYEES.find((e) => e.id === asg.employee_id);
                              if (!emp) return null;
                              return (
                                <img
                                  key={asg.id}
                                  src={emp.avatar}
                                  alt={emp.first_name}
                                  title={`${emp.first_name} – ${asg.role} (${asg.allocation_percentage}%)`}
                                  className="h-7 w-7 rounded-full ring-2 ring-white object-cover"
                                />
                              );
                            })}
                            {projAssigns.length === 0 && <span className="text-xs text-slate-400">Unassigned</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => { setSelectedProj(p); setIsAssignOpen(true); }}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors"
                          >
                            + Assign
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CAPACITY MATRIX TAB */}
        {activeTab === "resource_matrix" && (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Draftsmen & Engineer Capacity Matrix</h3>
                <p className="text-sm text-slate-500">Allocation percentage from active project assignments.</p>
              </div>
              {employeeWorkloads.map(({ employee, totalAlloc, assignments: empAssigns }) => (
                <div key={employee.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={employee.avatar} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100" />
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{employee.first_name} {employee.last_name}</p>
                        <p className="text-xs text-slate-500">{employee.designation} · {employee.department}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold border",
                      totalAlloc > 100 ? "bg-red-50 text-red-700 border-red-200" :
                      totalAlloc === 100 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      totalAlloc > 0 ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-gray-50 text-gray-500 border-gray-200"
                    )}>
                      {totalAlloc}% Allocated{totalAlloc > 100 ? " ⚠ OVERLOAD" : ""}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", totalAlloc > 100 ? "bg-red-500" : "bg-blue-500")}
                      style={{ width: `${Math.min(100, totalAlloc)}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {empAssigns.map((asg) => {
                      const proj = projects.find((p) => p.id === asg.project_id);
                      return (
                        <span key={asg.id} className="text-xs px-2.5 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg font-medium">
                          <span className="text-blue-600 font-bold">{proj?.code}</span>
                          {" · "}{asg.role} ({asg.allocation_percentage}%)
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-blue-600" /> Resource Bench
                </h3>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-xs font-semibold text-emerald-700">Available Capacity</p>
                  <p className="text-2xl font-bold text-emerald-700">{employeeWorkloads.filter((w) => w.totalAlloc < 100).length} Engineers</p>
                  <p className="text-xs text-emerald-600 mt-1">Can take new assignments</p>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs font-semibold text-red-700">Over-Allocated</p>
                  <p className="text-2xl font-bold text-red-700">{employeeWorkloads.filter((w) => w.totalAlloc > 100).length} Engineers</p>
                  <p className="text-xs text-red-600 mt-1">Require workload rebalancing</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MILESTONES TAB */}
        {activeTab === "milestones" && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div key={proj.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div>
                    <span className="font-mono text-xs text-blue-600 font-bold">{proj.code}</span>
                    <p className="font-bold text-gray-900 text-sm">{proj.name}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-slate-600 font-semibold">
                    {proj.tasks.completed}/{proj.tasks.total} Done
                  </span>
                </div>
                <div className="p-3 space-y-2">
                  {proj.milestones.map((m) => (
                    <label key={m.id} className="flex items-center justify-between p-3 hover:bg-blue-50/40 rounded-lg cursor-pointer border border-transparent hover:border-blue-100 transition-all">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={m.is_completed}
                          onChange={() => handleToggleMilestone(proj.id, m.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={cn("text-sm font-medium", m.is_completed ? "line-through text-slate-400" : "text-gray-800")}>
                          {m.name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{m.due_date}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE PROJECT MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-blue-600" /> Create New Project
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAddProject} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Project Code</label>
                  <input type="text" required placeholder="e.g. PRJ-DEL-10" value={addForm.code}
                    onChange={(e) => setAddForm({ ...addForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Client Name</label>
                  <input type="text" required placeholder="e.g. L&T Heavy Eng." value={addForm.client}
                    onChange={(e) => setAddForm({ ...addForm, client: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Project Title</label>
                <input type="text" required placeholder="e.g. Mumbai Metro Line 4 Viaducts" value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Approved Budget ($)</label>
                  <input type="number" required value={addForm.budget}
                    onChange={(e) => setAddForm({ ...addForm, budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
                  <select value={addForm.priority} onChange={(e) => setAddForm({ ...addForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none bg-white"
                  >
                    <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN STAFF MODAL */}
      {isAssignOpen && selectedProj && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-gray-900">Assign Engineer</h3>
                <p className="text-xs text-slate-500">{selectedProj.code} · {selectedProj.name}</p>
              </div>
              <button onClick={() => setIsAssignOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Employee</label>
                <select required value={assignForm.employee_id} onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none bg-white"
                >
                  <option value="">-- Select Staff --</option>
                  {ENTERPRISE_EMPLOYEES.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.designation})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role</label>
                  <select value={assignForm.role} onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none bg-white"
                  >
                    <option>Lead Engineer</option><option>BIM Specialist</option>
                    <option>Structural Detailer</option><option>Checker</option><option>Modeler</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Allocation</label>
                  <select value={assignForm.allocation_percentage} onChange={(e) => setAssignForm({ ...assignForm, allocation_percentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none bg-white"
                  >
                    <option value={25}>25%</option><option value={50}>50%</option>
                    <option value={75}>75%</option><option value={100}>100%</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setIsAssignOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm">Assign Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
