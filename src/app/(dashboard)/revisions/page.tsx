"use client";

import { useState, useEffect } from "react";
import { getRevisionHistory, createRevision } from "@/lib/api/documents";
import { getProjects } from "@/lib/api/projects";
import { RevisionRecord } from "@/types/documents";
import { Project } from "@/types/projects";
import { Dialog } from "@/components/layout/Dialog";
import {
  GitBranch,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RevisionsPage() {
  const [revisions, setRevisions] = useState<RevisionRecord[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [selectedProj, setSelectedProj] = useState("all");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [form, setForm] = useState({
    project_id: "",
    drawing_number: "",
    revision_type: "Internal Revision" as RevisionRecord["revision_type"],
    description: "",
    date: new Date().toISOString().split("T")[0],
    is_billable: false,
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [revs, projs] = await Promise.all([
        getRevisionHistory(),
        getProjects(),
      ]);
      setRevisions(revs);
      
      const mappedProjs = projs.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        client: p.client,
        status: p.status,
      }));
      setProjects(mappedProjs);

      if (mappedProjs.length > 0) {
        setForm((prev) => ({ ...prev, project_id: mappedProjs[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setForm({
      project_id: projects[0]?.id || "",
      drawing_number: "",
      revision_type: "Internal Revision",
      description: "",
      date: new Date().toISOString().split("T")[0],
      is_billable: false,
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project_id || !form.drawing_number || !form.description || !form.date) {
      setFormError("All fields are required.");
      return;
    }
    try {
      await createRevision(form);
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to log revision");
    }
  };

  const getProjectName = (id: string) => {
    const p = projects.find((proj) => proj.id === id);
    return p ? p.name : "Unknown Project";
  };

  const getProjectCode = (id: string) => {
    const p = projects.find((proj) => proj.id === id);
    return p ? p.code : "—";
  };

  // Filter revisions
  const filteredRevisions = Array.isArray(revisions) ? revisions.filter((rev) => {
    const matchesSearch =
      rev.drawing_number.toLowerCase().includes(search.toLowerCase()) ||
      rev.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesProj = selectedProj === "all" || rev.project_id === selectedProj;

    return matchesSearch && matchesProj;
  }) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revision Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log drawing revision histories, internal engineering corrections, and client design changes.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg shadow-lg hover:shadow-brand-500/20 transition-all duration-150 self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          Log Revision
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        <div>
          <select
            value={selectedProj}
            onChange={(e) => setSelectedProj(e.target.value)}
            className="px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by drawing number, desc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Revisions Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border">
            <tr>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Drawing Number</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Project</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Revision Type</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Date</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Description</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Billing Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRevisions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <GitBranch className="h-8 w-8 text-white/30" />
                    <span>No revisions logged yet.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRevisions.map((rev) => (
                <tr key={rev.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-foreground">{rev.drawing_number}</td>
                  <td className="px-6 py-4">
                    <div className="text-foreground font-semibold">{getProjectName(rev.project_id)}</div>
                    <div className="text-xs font-mono text-muted-foreground">{getProjectCode(rev.project_id)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-medium border",
                        rev.revision_type === "Client Revision"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      )}
                    >
                      {rev.revision_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-mono">{rev.date}</td>
                  <td className="px-6 py-4 text-muted-foreground max-w-sm whitespace-pre-wrap">{rev.description}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
                        rev.is_billable
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      )}
                    >
                      {rev.is_billable ? "Billable" : "Non-Billable"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD DIALOG */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Log Drawing Revision" size="sm">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Project *</label>
            <select
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Drawing Number *</label>
              <input
                type="text"
                value={form.drawing_number}
                onChange={(e) => setForm({ ...form, drawing_number: e.target.value })}
                placeholder="DRW-ORION-005"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Revision Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Revision Type</label>
            <select
              value={form.revision_type}
              onChange={(e) => setForm({ ...form, revision_type: e.target.value as RevisionRecord["revision_type"] })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
            >
              <option value="Internal Revision">Internal Revision</option>
              <option value="Client Revision">Client Revision</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Revision Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe modifications made to detailing..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_billable"
              checked={form.is_billable}
              onChange={(e) => setForm({ ...form, is_billable: e.target.checked })}
              className="rounded border-input text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="is_billable" className="text-xs font-medium text-foreground cursor-pointer">
              Is this revision billable to the client?
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
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
              Save Revision
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
