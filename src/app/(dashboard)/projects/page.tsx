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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getProjects, createProject, deleteProject, EnterpriseProject } from "@/lib/api/projects";
import { cn } from "@/lib/utils";

export default function EnterpriseProjectsPage() {
  const [projects, setProjects] = useState<EnterpriseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [addForm, setAddForm] = useState({
    code: "", name: "", client: "",
    start_date: "2026-07-01", end_date: "2026-12-31",
    mail_number: "", mail_cc: "",
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
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.client.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newProj = await createProject({
        ...addForm,
        status: "Planned",
      });
      setProjects([newProj, ...projects]);
      setIsAddOpen(false);
      showToast("Project created successfully", "success");
      setAddForm({ code: "", name: "", client: "", start_date: "2026-07-01", end_date: "2026-12-31", mail_number: "", mail_cc: "" });
    } catch (error: unknown) {
      const err = error as any;
      showToast(err.response?.data?.detail || "Failed to create project", "error");
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
    } catch {
      showToast("Failed to delete project", "error");
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
        <div className={cn("fixed top-6 right-6 px-4 py-3 rounded-xl shadow-lg border z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
          toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        )}>
          {toast.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Project Hub</h1>
          <p className="text-slate-500 mt-1">Manage enterprise projects and AI document registers.</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> New Project
        </button>
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
                      <span className="text-xs font-medium">{p.start_date} to {p.end_date}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-gray-900">Create New Project</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                <Trash2 className="h-4 w-4 opacity-0 hidden" />
                <span className="text-gray-500 font-bold text-lg leading-none">&times;</span>
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Project Code</label>
                  <input required type="text" value={addForm.code} onChange={(e) => setAddForm({ ...addForm, code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. PRJ-101" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Client Name</label>
                  <input required type="text" value={addForm.client} onChange={(e) => setAddForm({ ...addForm, client: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Acme Corp" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Project Name</label>
                <input required type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Downtown Metro Extension" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Start Date</label>
                  <input required type="date" value={addForm.start_date} onChange={(e) => setAddForm({ ...addForm, start_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">End Date</label>
                  <input required type="date" value={addForm.end_date} onChange={(e) => setAddForm({ ...addForm, end_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Mail Number</label>
                  <input type="text" value={addForm.mail_number} onChange={(e) => setAddForm({ ...addForm, mail_number: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. ALEF-2026-140" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">CC List</label>
                  <input type="text" value={addForm.mail_cc} onChange={(e) => setAddForm({ ...addForm, mail_cc: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. client@company.com" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50">
                  {isSaving ? "Saving..." : "Create Project"}
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
