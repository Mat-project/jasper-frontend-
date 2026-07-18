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
  Calendar,
  X,
  Filter,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Edit2,
  UserPlus,
  CheckCircle2,
  Clock,
  TrendingDown,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  EnterpriseProject,
  EnterpriseAssignment,
} from "@/data/mockEnterpriseData";
import { getProjects, createProject, deleteProject, getAssignments, createAssignment, updateProject } from "@/lib/api/projects";
import { getEmployees } from "@/lib/api/employees";
import { cn } from "@/lib/utils";

export default function EnterpriseProjectsPage() {
  const [projects, setProjects] = useState<EnterpriseProject[]>([]);
  const [assignments, setAssignments] = useState<EnterpriseAssignment[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [projData, assignData, empData] = await Promise.all([
          getProjects(),
          getAssignments(),
          getEmployees(),
        ]);
        setProjects(projData);
        setAssignments(assignData);
        const mappedEmps = empData.map((emp: any) => ({
          id: emp.id,
          code: emp.employee_code || emp.id.substring(0, 8),
          first_name: emp.first_name || "",
          last_name: emp.last_name || "",
          email: emp.email,
          phone: emp.phone_number || "",
          avatar: emp.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          designation: emp.role || "Engineer",
          department: emp.department || "Engineering",
        }));
        setEmployees(mappedEmps);
      } catch (err) {
        console.error("Failed to load projects data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  const [activeTab, setActiveTab] = useState<"portfolio" | "resource_matrix" | "milestones">("portfolio");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedProj, setSelectedProj] = useState<EnterpriseProject | null>(null);
  const [viewProj, setViewProj] = useState<EnterpriseProject | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<EnterpriseProject>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [addForm, setAddForm] = useState({
    code: "", name: "", client: "",
    start_date: "2026-07-01", end_date: "2026-12-31",
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
    return matchesSearch && matchesStatus;
  });

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setAssignments((prev) => prev.filter((a) => a.project_id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: EnterpriseProject["status"]) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    try {
      await updateProject(id, { status: newStatus });
    } catch (err) {
      console.error("Failed to update project status", err);
    }
  };

  const handlePriorityChange = async (id: string, newPriority: EnterpriseProject["priority"]) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, priority: newPriority } : p))
    );
    try {
      await updateProject(id, { priority: newPriority });
    } catch (err) {
      console.error("Failed to update project priority", err);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProj) return;
    setIsSaving(true);
    try {
      const updated = await updateProject(selectedProj.id, editForm);
      setProjects((prev) => prev.map((p) => (p.id === selectedProj.id ? { ...p, ...updated } : p)));
      setIsEditOpen(false);
      setToast({ message: "Project updated successfully.", type: "success" });
    } catch (err) {
      console.error("Failed to save project", err);
      setToast({ message: "Failed to update project. Please try again.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirmed = async (id: string) => {
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setAssignments((prev) => prev.filter((a) => a.project_id !== id));
      setDeleteConfirmId(null);
      setToast({ message: "Project deleted successfully.", type: "success" });
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to delete project.", type: "error" });
    }
  };

  // Auto-dismiss toast after 3 seconds
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const employeeWorkloads = employees.map((emp) => {
    const empAssigns = assignments.filter((a) => a.employee_id === emp.id);
    const totalAlloc = empAssigns.reduce((sum, a) => sum + a.allocation_percentage, 0);
    return { employee: emp, assignments: empAssigns, totalAlloc };
  });

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.code || !addForm.name || !addForm.client) return;
    try {
      const newProj = await createProject({
        code: addForm.code,
        name: addForm.name,
        client: addForm.client,
        start_date: addForm.start_date,
        end_date: addForm.end_date,
        status: "Active",
      });
      setProjects([newProj, ...projects]);
      setIsAddOpen(false);
      setAddForm({ code: "", name: "", client: "", start_date: "2026-07-01", end_date: "2026-12-31" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProj || !assignForm.employee_id) return;
    try {
      const newAssign = await createAssignment({
        project_id: selectedProj.id,
        employee_id: assignForm.employee_id,
        role: assignForm.role,
        allocation_percentage: Number(assignForm.allocation_percentage),
      });
      setAssignments([...assignments, newAssign]);
      setIsAssignOpen(false);
      setAssignForm({ employee_id: "", role: "Structural Detailer", allocation_percentage: 50 });
    } catch (err) {
      console.error(err);
    }
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
      "High": "bg-orange-50 text-orange-700 border-orange-200",
      "Low":  "bg-slate-50 text-slate-600 border-slate-200",
    };
    return map[priority] || "bg-gray-50 text-gray-600 border-gray-200";
  };

  const isOverdue = (endDate: string) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
                  <option value="on hold">On Hold</option>
                  <option value="planned">Planned</option>
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
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <div className="p-4 bg-slate-50 rounded-full">
                            <FolderKanban className="h-9 w-9 text-slate-300" />
                          </div>
                          <p className="font-semibold text-slate-600 text-sm">No projects available</p>
                          <p className="text-xs text-slate-400">Create your first project to get started</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {filteredProjects.map((p) => {
                    const projAssigns = assignments.filter((a) => a.project_id === p.id);
                    const displayAssigns = projAssigns.slice(0, 3);
                    const extraCount = projAssigns.length - 3;
                    const overdue = isOverdue(p.end_date) && p.status !== "Completed";
                    const progressColor = p.progress >= 80 ? "bg-emerald-500" : p.progress >= 40 ? "bg-blue-500" : "bg-amber-500";
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                        onClick={() => { if (openActionMenu === p.id) setOpenActionMenu(null); }}
                      >
                        <td 
                          className="px-4 py-3.5 cursor-pointer hover:bg-blue-100/50" 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/projects/${p.id}`);
                          }}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="inline-block font-mono text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                              {p.code}
                            </span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </div>
                          <p className="font-semibold text-gray-900 text-sm hover:text-blue-700 transition-colors">{p.name}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />{p.client}
                          </div>
                        </td>
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.id, e.target.value as EnterpriseProject["status"])}
                            className={cn(
                              "text-xs font-semibold rounded-full border px-2.5 py-0.5 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors",
                              statusBadge(p.status)
                            )}
                          >
                            <option value="Active">Active</option>
                            <option value="At Risk">At Risk</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Planned">Planned</option>
                          </select>
                        </td>
                        {/* Priority */}
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={p.priority || "Low"}
                            onChange={(e) => handlePriorityChange(p.id, e.target.value as EnterpriseProject["priority"])}
                            className={cn(
                              "text-xs font-bold rounded-full border px-2.5 py-0.5 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors w-fit block",
                              priorityBadge(p.priority || "Low")
                            )}
                          >
                            <option value="High">High</option>
                            <option value="Low">Low</option>
                          </select>
                        </td>
                        {/* Due Date */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm text-slate-700 font-medium flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {formatDate(p.end_date)}
                            </span>
                            {overdue && (
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 w-fit">
                                Overdue
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Progress */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", progressColor)}
                                style={{ width: `${p.progress ?? 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-700 w-8">{p.progress ?? 0}%</span>
                          </div>
                        </td>
                        {/* Team avatars stacked, +N overflow */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center -space-x-2">
                            {displayAssigns.map((asg) => {
                              const emp = employees.find((e) => e.id === asg.employee_id);
                              if (!emp) return null;
                              return (
                                <img
                                  key={asg.id}
                                  src={emp.avatar}
                                  alt={emp.first_name}
                                  title={`${emp.first_name} ${emp.last_name} – ${asg.role} (${asg.allocation_percentage}%)`}
                                  className="h-7 w-7 rounded-full ring-2 ring-white object-cover"
                                />
                              );
                            })}
                            {extraCount > 0 && (
                              <span className="h-7 w-7 rounded-full ring-2 ring-white bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                +{extraCount}
                              </span>
                            )}
                            {projAssigns.length === 0 && <span className="text-xs text-slate-400">Unassigned</span>}
                          </div>
                        </td>
                        {/* Three-dot Action Menu */}
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end relative">
                            <button
                              onClick={() => setOpenActionMenu(openActionMenu === p.id ? null : p.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-500 hover:text-slate-800 transition-colors"
                              title="Actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {openActionMenu === p.id && (
                              <div className="absolute right-0 top-8 z-30 w-44 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                                <button
                                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                  onClick={() => { setViewProj(p); setOpenActionMenu(null); }}
                                >
                                  <Eye className="h-4 w-4" /> Quick View
                                </button>
                                <button
                                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                  onClick={() => { router.push(`/projects/${p.id}`); setOpenActionMenu(null); }}
                                >
                                  <ExternalLink className="h-4 w-4" /> Full Details
                                </button>
                                <button
                                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                  onClick={() => { setSelectedProj(p); setEditForm(p); setIsEditOpen(true); setOpenActionMenu(null); }}
                                >
                                  <Edit2 className="h-4 w-4" /> Edit
                                </button>
                                <button
                                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                  onClick={() => { setSelectedProj(p); setIsAssignOpen(true); setOpenActionMenu(null); }}
                                >
                                  <UserPlus className="h-4 w-4" /> Assign Members
                                </button>
                                <div className="border-t border-gray-100" />
                                <button
                                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                  onClick={() => { setDeleteConfirmId(p.id); setOpenActionMenu(null); }}
                                >
                                  <Trash2 className="h-4 w-4" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
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

      {/* VIEW PROJECT MODAL */}
      {viewProj && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-blue-600" /> Project Details
              </h3>
              <button onClick={() => setViewProj(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <span className="inline-block font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded mb-2">
                    {viewProj.code}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900">{viewProj.name}</h2>
                  <div className="flex items-center gap-2 text-slate-600 mt-2">
                    <Building2 className="h-4 w-4" /> {viewProj.client}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-start md:items-end">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 w-fit", statusBadge(viewProj.status))}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />{viewProj.status}
                  </span>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-bold border w-fit block", priorityBadge(viewProj.priority || "Low"))}>
                    Priority: {viewProj.priority || "Low"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Start Date</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> {formatDate(viewProj.start_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">End Date</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> {formatDate(viewProj.end_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Budget</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" /> ${(viewProj.budget / 1000).toFixed(1)}k
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Spent</p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5 text-slate-400" /> ${(viewProj.spent / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-gray-700">Overall Progress</span>
                  <span className="text-emerald-600">{viewProj.progress ?? 0}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${viewProj.progress ?? 0}%` }} />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Assigned Team</h4>
                <div className="space-y-3">
                  {assignments.filter((a) => a.project_id === viewProj.id).map((asg) => {
                    const emp = employees.find((e) => e.id === asg.employee_id);
                    if (!emp) return null;
                    return (
                      <div key={asg.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <img src={emp.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{emp.first_name} {emp.last_name}</p>
                            <p className="text-xs text-slate-500">{emp.designation}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{asg.role}</p>
                          <p className="text-xs text-slate-500 mt-1">{asg.allocation_percentage}% Allocation</p>
                        </div>
                      </div>
                    );
                  })}
                  {assignments.filter((a) => a.project_id === viewProj.id).length === 0 && (
                    <p className="text-sm text-slate-500 italic p-4 text-center bg-gray-50 rounded-lg">No team members assigned yet.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button onClick={() => setViewProj(null)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {isEditOpen && selectedProj && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" /> Edit Project
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Project Code</label>
                  <input type="text" required value={editForm.code || ""}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Client Name</label>
                  <input type="text" required value={editForm.client || ""}
                    onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Project Title</label>
                <input type="text" required value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none bg-gray-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                  <select value={editForm.status || "Active"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Planned">Planned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
                  <select value={editForm.priority || "Low"} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Start Date</label>
                  <input type="date" value={editForm.start_date || ""}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">End Date</label>
                  <input type="date" value={editForm.end_date || ""}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Budget ($)</label>
                  <input type="number" required value={editForm.budget || 0}
                    onChange={(e) => setEditForm({ ...editForm, budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Progress (%)</label>
                  <input type="number" min="0" max="100" required value={editForm.progress ?? 0}
                    onChange={(e) => setEditForm({ ...editForm, progress: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50"
                  disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2"
                  disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Start Date</label>
                  <input type="date" value={addForm.start_date}
                    onChange={(e) => setAddForm({ ...addForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">End Date</label>
                  <input type="date" value={addForm.end_date}
                    onChange={(e) => setAddForm({ ...addForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none"
                  />
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
                  {employees.map((emp) => (
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
      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (() => {
        const proj = projects.find((p) => p.id === deleteConfirmId);
        if (!proj) return null;
        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 overflow-hidden">
              <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
                <div className="p-3 bg-red-50 rounded-full">
                  <AlertTriangle className="h-7 w-7 text-red-500" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Delete Project?</h3>
                <p className="text-sm text-slate-500">
                  You are about to permanently delete{" "}
                  <span className="font-bold text-gray-800">{proj.name}</span>{" "}
                  <span className="font-mono text-xs text-blue-600">({proj.code})</span>.
                  <br />
                  All assignments linked to this project will also be removed.
                </p>
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-full">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteConfirmed(deleteConfirmId)}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete Project
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-xl animate-in slide-in-from-bottom-5">
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          )}
          <p className="text-sm font-semibold text-gray-800">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      )}
    </div>
  );
}
