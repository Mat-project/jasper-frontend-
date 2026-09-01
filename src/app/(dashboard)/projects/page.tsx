"use client";

import React, { useState, useEffect } from "react";
import {
  FolderKanban,
  Building2,
  Calendar,
  Search,
  Plus,
  Trash2,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Clock,
  TrendingDown,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  X,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getProjects, createProject, deleteProject, EnterpriseProject } from "@/lib/api/projects";
import { cn } from "@/lib/utils";

/** Safely formats any backend API error response into a clean, human-readable user message. */
function formatUserFriendlyError(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  const err = error as any;
  const data = err?.response?.data || err?.data || err;

  if (typeof data === "string") return data;

  if (typeof data === "object" && data !== null) {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.error === "string") return data.error;
    if (typeof data.message === "string") return data.message;

    const messages: string[] = [];
    for (const [field, value] of Object.entries(data)) {
      let valStr = "";
      if (Array.isArray(value)) {
        valStr = value.map(v => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(" ");
      } else if (typeof value === "string") {
        valStr = value;
      } else if (typeof value === "object" && value !== null) {
        valStr = JSON.stringify(value);
      }

      if (valStr) {
        const fieldName = field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        if (valStr.toLowerCase().includes("already exists")) {
          messages.push(`Project code already exists. Please choose a different code.`);
        } else if (valStr.toLowerCase().includes("required") || valStr.toLowerCase().includes("blank")) {
          messages.push(`${fieldName} is required.`);
        } else {
          messages.push(`${fieldName}: ${valStr}`);
        }
      }
    }
    if (messages.length > 0) return messages.join(" ");
  }

  return err?.message || "Failed to complete project creation. Please check the details.";
}

export default function EnterpriseProjectsPage() {
  const [projects, setProjects] = useState<EnterpriseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [addForm, setAddForm] = useState({
    code: "", name: "", client: "",
    start_date: "2026-07-01",
    mail_number: "", mail_to: "", mail_cc: "", mail_bcc: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const projData = await getProjects();
        setProjects(projData);
      } catch (err) {
        console.error("Failed to load projects data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalProjects = projects.length;
  const activeCount = projects.filter((p) => p.status === "Active").length;
  const completedCount = projects.filter((p) => p.status === "Completed").length;

  const showToast = (message: string, type: "success" | "error") => {
    const displayMsg = typeof message === "string" ? message : formatUserFriendlyError(message);
    setToast({ message: displayMsg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.client.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);
    try {
      const newProj = await createProject({
        ...addForm,
        status: "Planned",
      });
      setProjects([newProj, ...projects]);
      setIsAddOpen(false);
      showToast("Project created successfully", "success");
      setAddForm({ code: "", name: "", client: "", start_date: "2026-07-01", mail_number: "", mail_to: "", mail_cc: "", mail_bcc: "" });
    } catch (error: unknown) {
      const userMsg = formatUserFriendlyError(error);
      setModalError(userMsg);
      showToast(userMsg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
      setDeleteConfirmId(null);
      setOpenActionMenu(null);
      showToast("Project deleted", "success");
    } catch (err) {
      showToast(formatUserFriendlyError(err), "error");
    }
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

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6 relative">
      {/* Toast */}
      {toast && (
        <div className={cn("fixed top-6 right-6 px-5 py-3.5 rounded-xl shadow-2xl border z-[9999] flex items-center gap-3 animate-in fade-in slide-in-from-top-2 max-w-md",
          toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-red-50 border-red-200 text-red-900"
        )}>
          {toast.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <TrendingDown className="h-5 w-5 text-red-600 shrink-0" />}
          <span className="font-semibold text-xs leading-relaxed">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Project Hub</h1>
          <p className="text-slate-500 mt-1">Manage enterprise projects and AI document registers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              const now = new Date();
              const year = now.getFullYear();
              const month = now.getMonth() + 1;
              try {
                const { exportMonthlyRegister } = await import("@/lib/api/register_ai");
                const blob = await exportMonthlyRegister(year, month);
                const url = window.URL.createObjectURL(blob);
                const a = window.document.createElement("a");
                a.href = url;
                a.download = `JASPER_MAIL_REGISTER_${now.toLocaleString("en-US", { month: "long" }).toUpperCase()}_${year}.xlsx`;
                window.document.body.appendChild(a);
                a.click();
                window.document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                showToast("Monthly Mail Register downloaded", "success");
              } catch (e) {
                console.error("Export failed", e);
                showToast("Failed to export monthly register", "error");
              }
            }}
            className="px-4 py-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Monthly Mail Register
          </button>
          <button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" /> New Project
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <FolderKanban className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Projects</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalProjects}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active</p>
            <h3 className="text-2xl font-bold text-gray-900">{activeCount}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <Clock className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Completed</p>
            <h3 className="text-2xl font-bold text-gray-900">{completedCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Project ID</th>
                <th className="px-6 py-4">Name & Client</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timeline</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProjects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-blue-700">{p.code}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{p.name}</p>
                    <div className="flex items-center gap-1 text-slate-500 mt-1">
                      <Building2 className="h-3 w-3" /> <span className="text-xs font-medium">{p.client}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold border", statusBadge(p.status))}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span className="text-xs font-medium">{p.start_date} to {p.end_date || "TBD"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 relative">
                      <button onClick={() => router.push(`/projects/${p.id}`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Open AI Register">
                        <FolderKanban className="h-4 w-4" />
                      </button>
                      <button onClick={() => setOpenActionMenu(openActionMenu === p.id ? null : p.id)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      
                      {openActionMenu === p.id && (
                        <div className="absolute right-0 top-10 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-2">
                          <button onClick={() => router.push(`/projects/${p.id}`)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <Eye className="h-4 w-4 text-slate-400" /> View Register
                          </button>
                          <div className="h-px bg-gray-100 my-1" />
                          <button onClick={() => setDeleteConfirmId(p.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 className="h-4 w-4 text-red-500" /> Delete Project
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No projects found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PROJECT MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Create New Project</h3>
                  <p className="text-xs text-slate-500">Define project credentials & default email routing.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setModalError(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Permanent In-Modal Error Alert Banner */}
              {modalError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-3 animate-fade-in shadow-sm">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-rose-900 text-xs">Project Creation Error</p>
                    <p className="mt-0.5 text-rose-700 text-xs font-mono break-words leading-relaxed">
                      {modalError}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalError(null)}
                    className="text-rose-400 hover:text-rose-700 transition-colors p-1"
                    title="Dismiss error"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Section 1: Project Identity */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Building2 className="h-3.5 w-3.5 text-blue-500" />
                  <span>1. Project Identity & Client</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Project Code <span className="text-rose-500">*</span></label>
                    <input
                      required
                      type="text"
                      value={addForm.code}
                      onChange={(e) => {
                        if (modalError) setModalError(null);
                        setAddForm({ ...addForm, code: e.target.value });
                      }}
                      className={cn(
                        "w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 transition-all",
                        modalError && modalError.toLowerCase().includes("code")
                          ? "border-rose-400 bg-rose-50/30 focus:ring-rose-400 text-rose-900"
                          : "border-gray-300 focus:ring-blue-500/20 focus:border-blue-600"
                      )}
                      placeholder="e.g. PRJ-101"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Client Name <span className="text-rose-500">*</span></label>
                    <input
                      required
                      type="text"
                      value={addForm.client}
                      onChange={(e) => {
                        if (modalError) setModalError(null);
                        setAddForm({ ...addForm, client: e.target.value });
                      }}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Project Title / Name <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="text"
                    value={addForm.name}
                    onChange={(e) => {
                      if (modalError) setModalError(null);
                      setAddForm({ ...addForm, name: e.target.value });
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    placeholder="e.g. Downtown Metro Extension"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Project Start Date <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="date"
                    value={addForm.start_date}
                    onChange={(e) => setAddForm({ ...addForm, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              {/* Section 2: Transmittal Mail Configuration */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                  <span>2. Transmittal Mail Routing</span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Initial Transmittal Mail Number</label>
                  <input
                    type="text"
                    value={addForm.mail_number}
                    onChange={(e) => setAddForm({ ...addForm, mail_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    placeholder="e.g. JANU-SUB-001"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Default To Recipients (comma-separated)</label>
                  <input
                    type="text"
                    value={addForm.mail_to}
                    onChange={(e) => setAddForm({ ...addForm, mail_to: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    placeholder="e.g. client@company.com, lead@company.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Default CC</label>
                    <input
                      type="text"
                      value={addForm.mail_cc}
                      onChange={(e) => setAddForm({ ...addForm, mail_cc: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      placeholder="e.g. pm@jasper.ae"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Default BCC</label>
                    <input
                      type="text"
                      value={addForm.mail_bcc}
                      onChange={(e) => setAddForm({ ...addForm, mail_bcc: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      placeholder="e.g. archive@jasper.ae"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setModalError(null);
                  }}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isSaving ? "Creating Project..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Delete Project?</h3>
            <p className="text-sm text-slate-500">
              Are you sure you want to permanently delete this project? This cannot be undone.
            </p>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDeleteProject(deleteConfirmId)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
