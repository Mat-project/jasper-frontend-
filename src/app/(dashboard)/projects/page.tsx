"use client";

import { useState, useEffect } from "react";
import { mockService } from "@/lib/api/mockService";
import { Dialog } from "@/components/layout/Dialog";
import { Project } from "@/types/projects";
import { User } from "@/types/user";
import {
  FolderKanban,
  Plus,
  Search,
  Eye,
  Edit2,
  Users,
  Calendar,
  Building2,
  AlertCircle,
  X,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Search & Status tabs
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"All" | "Not Started" | "In Progress" | "On Hold" | "Completed">("All");

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedProj, setSelectedProj] = useState<Project | null>(null);

  // Form states
  const [form, setForm] = useState({
    code: "",
    name: "",
    client: "",
    start_date: "",
    end_date: "",
    status: "Not Started" as Project["status"],
  });
  const [assignForm, setAssignForm] = useState({ employee_id: "" });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProjects(mockService.getProjects());
    setEmployees(mockService.getEmployees().filter((e) => e.is_active));
    setAssignments(mockService.getProjectAssignments());
  };

  const handleOpenAdd = () => {
    setForm({
      code: "",
      name: "",
      client: "",
      start_date: "",
      end_date: "",
      status: "Not Started",
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setSelectedProj(p);
    setForm({
      code: p.code,
      name: p.name,
      client: p.client,
      start_date: p.start_date,
      end_date: p.end_date,
      status: p.status,
    });
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleOpenDetails = (p: Project) => {
    setSelectedProj(p);
    setAssignForm({ employee_id: "" });
    setFormError(null);
    setIsDetailsOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.client || !form.start_date || !form.end_date) {
      setFormError("All fields are required.");
      return;
    }
    mockService.createProject(form);
    setIsAddOpen(false);
    loadData();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProj) return;
    if (!form.code || !form.name || !form.client || !form.start_date || !form.end_date) {
      setFormError("All fields are required.");
      return;
    }
    mockService.updateProject(selectedProj.id, form);
    setIsEditOpen(false);
    loadData();
    // Sync selected project in details dialog if open
    if (isDetailsOpen) {
      setSelectedProj({ ...selectedProj, ...form });
    }
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProj || !assignForm.employee_id) return;
    mockService.assignEmployeeToProject(selectedProj.id, assignForm.employee_id);
    setAssignForm({ employee_id: "" });
    loadData();
  };

  const handleRemoveAssignment = (assignId: string) => {
    mockService.unassignEmployeeFromProject(assignId);
    loadData();
  };

  // Filter project list
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusTab === "All" || p.status === statusTab;

    return matchesSearch && matchesStatus;
  });

  const getAssignedTeam = (projId: string) => {
    return assignments
      .filter((a) => a.project_id === projId)
      .map((a) => {
        const emp = employees.find((e) => e.id === a.employee_id);
        return {
          assignmentId: a.id,
          employee: emp,
        };
      })
      .filter((a) => a.employee !== undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create projects, assign teams, and track structural detail schedules.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg shadow-lg hover:shadow-brand-500/20 transition-all duration-150 self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          Add Project
        </button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-background p-1 rounded-lg border border-border self-start">
          {(["All", "Not Started", "In Progress", "On Hold", "Completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={cn(
                "px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
                statusTab === tab
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-500/5"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search code, project, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Project Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-card rounded-xl border border-border">
            <div className="flex flex-col items-center justify-center gap-2">
              <FolderKanban className="h-10 w-10 text-white/20" />
              <span>No projects found matching the status filter.</span>
            </div>
          </div>
        ) : (
          filteredProjects.map((p) => {
            const team = getAssignedTeam(p.id);
            return (
              <div
                key={p.id}
                className="bg-card border border-border hover:border-slate-700/80 hover:shadow-md transition-all duration-200 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Status Badge */}
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                      {p.code}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                        p.status === "In Progress" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                        p.status === "Not Started" && "bg-slate-500/10 text-slate-400 border-slate-500/20",
                        p.status === "On Hold" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        p.status === "Completed" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      )}
                    >
                      {p.status}
                    </span>
                  </div>

                  {/* Title & Client */}
                  <h3 className="text-lg font-bold text-foreground mt-3 line-clamp-1">{p.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Client: <span className="text-foreground font-medium">{p.client}</span></span>
                  </div>

                  {/* Date range */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3 border-t border-border/60 pt-3">
                    <Calendar className="h-3.5 w-3.5 text-white/40" />
                    <span>
                      {p.start_date} to {p.end_date}
                    </span>
                  </div>
                </div>

                {/* Team & Actions Footer */}
                <div className="flex items-center justify-between gap-4 mt-6 pt-3 border-t border-border/60">
                  {/* Avatar stack */}
                  <div className="flex items-center -space-x-2 overflow-hidden">
                    {team.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No team assigned</span>
                    ) : (
                      team.slice(0, 4).map((member, i) => (
                        <div
                          key={member.assignmentId}
                          className="inline-block h-7 w-7 rounded-full ring-2 ring-card bg-brand-500/20 text-brand-300 font-bold text-xs flex items-center justify-center border border-brand-500/30"
                          title={member.employee?.full_name}
                        >
                          {member.employee?.first_name[0]}
                        </div>
                      ))
                    )}
                    {team.length > 4 && (
                      <div className="inline-block h-7 w-7 rounded-full ring-2 ring-card bg-slate-800 text-muted-foreground font-semibold text-xs flex items-center justify-center border border-border">
                        +{team.length - 4}
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenDetails(p)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground transition-colors"
                      title="Edit Project"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD DIALOG */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Project" size="md">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Project Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="PRJ-200"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Client Name *</label>
              <input
                type="text"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                placeholder="Client Inc."
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Project Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Provide a detailed project title..."
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Start Date *</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">End Date *</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Project["status"] })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border border-input rounded-lg text-sm font-medium hover:bg-muted text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Save Project
            </button>
          </div>
        </form>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Project" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Project Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Client Name *</label>
              <input
                type="text"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Project Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Start Date *</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">End Date *</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Project["status"] })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-input rounded-lg text-sm font-medium hover:bg-muted text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Update Project
            </button>
          </div>
        </form>
      </Dialog>

      {/* DETAILS & TEAM ASSIGNMENT DIALOG */}
      <Dialog isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Project Details & Team" size="lg">
        {selectedProj && (
          <div className="space-y-6">
            {/* Upper details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-500/5 p-4 rounded-xl border border-border">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Project Code</span>
                <div className="font-mono font-bold mt-1 text-brand-400">{selectedProj.code}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Client Name</span>
                <div className="font-semibold mt-1 text-foreground">{selectedProj.client}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Project Duration</span>
                <div className="text-sm mt-1 text-foreground">
                  {selectedProj.start_date} to {selectedProj.end_date}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Status</span>
                <div className="mt-1">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
                      selectedProj.status === "In Progress" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                      selectedProj.status === "Not Started" && "bg-slate-500/10 text-slate-400 border-slate-500/20",
                      selectedProj.status === "On Hold" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      selectedProj.status === "Completed" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    )}
                  >
                    {selectedProj.status}
                  </span>
                </div>
              </div>
              <div className="col-span-full border-t border-border/60 pt-3 mt-1">
                <span className="text-xs font-semibold text-muted-foreground">Project Name</span>
                <div className="text-base font-bold mt-0.5 text-foreground">{selectedProj.name}</div>
              </div>
            </div>

            {/* Team assignment list & form */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Left side: Add Employee Form */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-brand-400" />
                  Assign Employee
                </h4>

                <form onSubmit={handleAssignSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Select Employee</label>
                    <select
                      value={assignForm.employee_id}
                      onChange={(e) => setAssignForm({ employee_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                      required
                    >
                      <option value="">-- Choose Staff --</option>
                      {employees
                        .filter((e) => !getAssignedTeam(selectedProj.id).some((a) => a.employee?.id === e.id))
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.full_name} ({e.roles[0]?.name || "Operator"})
                          </option>
                        ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium shadow-md transition-colors"
                  >
                    Assign Staff
                  </button>
                </form>
              </div>

              {/* Right side: Assigned list */}
              <div className="md:col-span-3 space-y-4 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-6">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-brand-400" />
                  Assigned Team ({getAssignedTeam(selectedProj.id).length})
                </h4>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {getAssignedTeam(selectedProj.id).length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                      No team members assigned to this project yet.
                    </div>
                  ) : (
                    getAssignedTeam(selectedProj.id).map((member) => (
                      <div
                        key={member.assignmentId}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-500/5 border border-border"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-brand-500/10 text-brand-300 font-bold text-xs flex items-center justify-center">
                            {member.employee?.first_name[0]}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-foreground">{member.employee?.full_name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {member.employee?.roles[0]?.name || "Operator"}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAssignment(member.assignmentId)}
                          className="p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          title="Remove assignment"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
