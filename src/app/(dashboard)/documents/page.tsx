"use client";

import { useState, useEffect } from "react";
import { mockService } from "@/lib/api/mockService";
import { Dialog } from "@/components/layout/Dialog";
import { Document, VersionHistory } from "@/types/documents";
import { Project } from "@/types/projects";
import {
  FileText,
  Plus,
  Search,
  Upload,
  Eye,
  History,
  Check,
  X,
  AlertCircle,
  FolderLock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [history, setHistory] = useState<VersionHistory[]>([]);

  // Page navigation tabs
  const [activeTab, setActiveTab] = useState<"list" | "approvals">("list");
  const [search, setSearch] = useState("");
  const [selectedProj, setSelectedProj] = useState("all");

  // Approval tabs
  const [approvalTab, setApprovalTab] = useState<Document["status"]>("Pending");

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isVersionOpen, setIsVersionOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Form states
  const [form, setForm] = useState({
    project_id: "",
    document_type: "PDF Drawing",
    version: "1.0",
    file_name: "",
    remarks: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDocuments(mockService.getDocuments());
    const projs = mockService.getProjects();
    setProjects(projs);
    setHistory(mockService.getVersionHistories());

    if (projs.length > 0) {
      setForm((prev) => ({ ...prev, project_id: projs[0].id }));
    }
  };

  const handleOpenUpload = () => {
    setForm({
      project_id: projects[0]?.id || "",
      document_type: "PDF Drawing",
      version: "1.0",
      file_name: "",
      remarks: "",
    });
    setFormError(null);
    setIsUploadOpen(true);
  };

  const handleOpenVersions = (doc: Document) => {
    setSelectedDoc(doc);
    setIsVersionOpen(true);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project_id || !form.version || !form.file_name || !form.remarks) {
      setFormError("All fields are required.");
      return;
    }
    mockService.uploadDocument({
      ...form,
      uploaded_by: "John Doe",
    });
    setIsUploadOpen(false);
    loadData();
  };

  const handleApproveDoc = (id: string) => {
    mockService.updateDocumentStatus(id, "Approved", undefined, "System Admin");
    loadData();
  };

  const handleRejectDoc = (id: string) => {
    const reason = prompt("Enter rejection remarks:") || "";
    mockService.updateDocumentStatus(id, "Rejected", reason, "System Admin");
    loadData();
  };

  const getProjectCode = (id: string) => {
    const p = projects.find((proj) => proj.id === id);
    return p ? p.code : "—";
  };

  const getProjectName = (id: string) => {
    const p = projects.find((proj) => proj.id === id);
    return p ? p.name : "Unknown Project";
  };

  // Filter documents
  const filteredDocs = documents.filter((d) => {
    const matchesSearch = d.file_name.toLowerCase().includes(search.toLowerCase()) || d.document_type.toLowerCase().includes(search.toLowerCase());
    const matchesProj = selectedProj === "all" || d.project_id === selectedProj;
    
    // Only approved documents show up in the main list tab
    const matchesTab = activeTab === "approvals" ? d.status === approvalTab : d.status === "Approved";
    return matchesSearch && matchesProj && matchesTab;
  });

  const getDocHistory = (docId: string) => {
    return history.filter((h) => h.document_id === docId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Control</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Store drawing sheets, track engineering designs, and manage revisions versioning control.
          </p>
        </div>
        <button
          onClick={handleOpenUpload}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg shadow-lg hover:shadow-brand-500/20 transition-all duration-150 self-start sm:self-center"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("list")}
            className={cn(
              "pb-3.5 text-sm font-semibold border-b-2 transition-colors",
              activeTab === "list"
                ? "border-brand-500 text-brand-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Approved Drawings
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={cn(
              "pb-3.5 text-sm font-semibold border-b-2 transition-colors",
              activeTab === "approvals"
                ? "border-brand-500 text-brand-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Approval Logs
          </button>
        </div>
      </div>

      {/* FILTER BAR: For normal list */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          {activeTab === "approvals" && (
            <div className="flex gap-1 p-1 bg-slate-500/5 rounded-lg border border-border">
              {(["Pending", "Approved", "Rejected"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setApprovalTab(tab)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
                    approvalTab === tab
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
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
            placeholder="Search by file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border">
            <tr>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Project</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">File details</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Document Type</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Uploaded By</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Version</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FolderLock className="h-8 w-8 text-white/30" />
                    <span>No documents found in this tab matching filters.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-foreground font-semibold">{getProjectName(doc.project_id)}</div>
                    <div className="text-xs font-mono text-muted-foreground">{getProjectCode(doc.project_id)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-foreground font-medium flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-brand-400" />
                      {doc.file_name}
                    </div>
                    <div className="text-xs text-muted-foreground">{doc.file_size || "—"}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{doc.document_type}</td>
                  <td className="px-6 py-4 text-muted-foreground">{doc.uploaded_by}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-foreground">
                      v{doc.version}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenVersions(doc)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground transition-colors"
                        title="Version History"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      {activeTab === "approvals" && approvalTab === "Pending" && (
                        <>
                          <button
                            onClick={() => handleApproveDoc(doc.id)}
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRejectDoc(doc.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* UPLOAD DIALOG */}
      <Dialog isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Document" size="sm">
        <form onSubmit={handleUploadSubmit} className="space-y-4">
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
              <label className="text-xs font-semibold text-muted-foreground">Document Type</label>
              <select
                value={form.document_type}
                onChange={(e) => setForm({ ...form, document_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              >
                <option value="PDF Drawing">PDF Drawing</option>
                <option value="DWG Blueprint">DWG Blueprint</option>
                <option value="Calculation Report">Calculation Report</option>
                <option value="Material Take-off">Material Take-off</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Version *</label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                placeholder="1.0"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">File Name *</label>
            <input
              type="text"
              value={form.file_name}
              onChange={(e) => setForm({ ...form, file_name: e.target.value })}
              placeholder="drawing_name_or_code.pdf"
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Remarks *</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="State any revision notices..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 border border-input rounded-lg text-sm font-medium hover:bg-muted text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Submit Upload
            </button>
          </div>
        </form>
      </Dialog>

      {/* VERSION HISTORY DIALOG */}
      <Dialog isOpen={isVersionOpen} onClose={() => setIsVersionOpen(false)} title="Document Version history" size="md">
        {selectedDoc && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-brand-400" />
              <div>
                <h4 className="text-sm font-bold text-foreground">{selectedDoc.file_name}</h4>
                <p className="text-xs text-muted-foreground">Project: {getProjectName(selectedDoc.project_id)}</p>
              </div>
            </div>

            {/* Version comparison list */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-foreground">Version history timeline:</h5>
              <div className="border border-border rounded-xl divide-y divide-border overflow-hidden bg-slate-500/5">
                {/* Current Active version */}
                <div className="p-3 bg-brand-500/5 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-brand-400 font-mono">Active v{selectedDoc.version}</span>
                    <div className="text-xs font-medium text-foreground mt-1">{selectedDoc.file_name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Uploaded by {selectedDoc.uploaded_by} on {new Date(selectedDoc.uploaded_at).toLocaleString()}
                    </div>
                    <div className="text-xs text-foreground bg-card p-2 rounded border border-border mt-2">
                      Remarks: {selectedDoc.remarks}
                    </div>
                  </div>
                </div>

                {/* Older versions */}
                {getDocHistory(selectedDoc.id).length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No older document versions found.
                  </div>
                ) : (
                  getDocHistory(selectedDoc.id).map((v) => (
                    <div key={v.id} className="p-3 flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground font-mono">Older v{v.version}</span>
                        <div className="text-xs font-medium text-foreground mt-1">{v.file_name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Uploaded by {v.uploaded_by} on {new Date(v.uploaded_at).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground p-2 rounded border border-border bg-card mt-2">
                          Remarks: {v.remarks}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsVersionOpen(false)}
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
