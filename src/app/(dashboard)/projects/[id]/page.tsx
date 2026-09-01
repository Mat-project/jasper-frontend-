"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  FolderKanban,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  FileSpreadsheet,
  Mail,
} from "lucide-react";
import { getProjects } from "@/lib/api/projects";
import { cn } from "@/lib/utils";
import AIRegisterTab from "./components/AIRegisterTab";
import RevisionManagementTab from "./components/RevisionManagementTab";
import RelationshipConfirmation from "./components/RelationshipConfirmation";
import RegisterReview from "./components/RegisterReview";
import TransmittalTab from "./components/TransmittalTab";
import { WorkspaceProvider, useProjectWorkspace } from "./WorkspaceProvider";

export default function ProjectDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      try {
        const projects = await getProjects();
        const p = projects.find((proj: any) => proj.id === id);
        if (p) setProject(p);
      } catch (error) {
        console.error("Failed to load project", error);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Project Not Found</h2>
          <p className="text-slate-500 mt-2">The project you are looking for does not exist or you don&apos;t have access.</p>
          <button onClick={() => router.push("/projects")} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Return to Projects
          </button>
        </div>
      </div>
    );
  }

  // WorkspaceProvider is mounted only after the project is known, so each
  // project gets its own isolated workspace instance (multi-project isolation).
  return (
    <WorkspaceProvider projectId={id}>
      <ProjectDetailsContent
        project={project}
        onProjectUpdated={setProject}
      />
    </WorkspaceProvider>
  );
}

function ProjectDetailsContent({
  project,
  onProjectUpdated,
}: {
  project: any;
  onProjectUpdated: (updated: any) => void;
}) {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeSubmissionId, refreshWorkspace, switchSubmission } = useProjectWorkspace();
  const [register, setRegister] = useState<any | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"Extraction" | "Relationships" | "Review" | "Revisions" | "Transmittals">("Extraction");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Read search params for deep linking (e.g. from a notification click).
  //   ?tab=<Tab>          → switch the active Register AI tab
  //   ?submission=<uuid>  → set the active submission via WorkspaceContext
  // The submission switch uses the existing WorkspaceContext API so every
  // Register AI tab stays synchronized. We track the last applied submission
  // param in a ref to avoid re-triggering the switch on unrelated re-renders.
  const lastAppliedSubmissionRef = React.useRef<string | null>(null);
  useEffect(() => {
    const tabParam = searchParams.get("tab") as any;
    if (tabParam && ["Extraction", "Relationships", "Review", "Revisions", "Transmittals"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const submissionParam = searchParams.get("submission");
    if (
      submissionParam &&
      submissionParam !== lastAppliedSubmissionRef.current &&
      submissionParam !== activeSubmissionId
    ) {
      lastAppliedSubmissionRef.current = submissionParam;
      // switchSubmission writes to the backend and refreshes workspace state,
      // which keeps every Register AI tab in sync (multi-tab consistency).
      switchSubmission(submissionParam);
    }
  }, [searchParams, activeSubmissionId, switchSubmission]);

  const fetchRegisterData = React.useCallback(async () => {
    if (!id) return;
    try {
      const { getRegisters, getRegisterRows } = await import("@/lib/api/register_ai");
      const regs = await getRegisters(id);
      if (regs && regs.length > 0) {
        const activeReg = regs[0];
        setRegister(activeReg);
        // Rows are fetched separately — not embedded in the Register object
        const registerRows = await getRegisterRows(id, activeReg.id);
        setRows(registerRows ?? []);

        // Deep linking to specific row — read URL directly (not via hook) to avoid dep loop
        const rowId = new URLSearchParams(window.location.search).get("row");
        if (rowId) {
          setTimeout(() => {
            const el = document.getElementById(`row-${rowId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50/50');
              setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50/50'), 3000);
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error("Failed to load register data", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // IMPORTANT: activeTab and searchParams intentionally excluded — adding them causes re-fetch on every tab switch

  const handleTabChange = React.useCallback((tabId: "Extraction" | "Relationships" | "Review" | "Revisions" | "Transmittals") => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("tab", tabId);
      router.replace(`/projects/${id}?${currentParams.toString()}`, { scroll: false });
    }
  }, [id, router]);

  // Fetch register data on initial mount so that reloading the page on the
  // Review tab does NOT show "No Register Generated Yet". Previously this was
  // called inside a useEffect that also handled the project prop, but that
  // effect was removed when tab-persistence was added, leaving no trigger.
  useEffect(() => {
    fetchRegisterData();
  }, [fetchRegisterData]);

  // Listen for completion events from AIRegisterTab.
  // On a successful ZIP completion:
  //   - refresh the shared workspace
  //   - re-fetch register data
  //   - auto-navigate to Pending Relationships
  useEffect(() => {
    const handleZipCompleted = () => {
      fetchRegisterData();
      refreshWorkspace();
      handleTabChange("Relationships");
    };
    window.addEventListener("zip-processing-completed", handleZipCompleted);
    return () => window.removeEventListener("zip-processing-completed", handleZipCompleted);
  }, [fetchRegisterData, refreshWorkspace, handleTabChange]);

  // When the user confirms the "Newer Submission Available" prompt by clicking
  // Switch, the NewerSubmissionModal updates the workspace and emits this
  // event. Auto-navigate to Pending Relationships so the user lands on the
  // next step of the workflow for the newly active submission.
  //
  // This listener lives in ProjectDetailsContent, which is mounted only for
  // the currently open project, so users working in another project are never
  // affected. No page reload is performed — only the in-page tab state flips.
  useEffect(() => {
    const handleSwitched = () => {
      setActiveTab("Relationships");
    };
    window.addEventListener("workspace-submission-switched", handleSwitched);
    return () => window.removeEventListener("workspace-submission-switched", handleSwitched);
  }, []);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Active: "bg-blue-50 text-blue-700 border-blue-200",
      "On Hold": "bg-amber-50 text-amber-700 border-amber-200",
      Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      "At Risk": "bg-rose-50 text-rose-700 border-rose-200"
    };
    return map[status] || "bg-gray-50 text-gray-600 border-gray-200";
  };

  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      Critical: "bg-red-50 text-red-700 border-red-200",
      High: "bg-orange-50 text-orange-700 border-orange-200",
      Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
      Low: "bg-green-50 text-green-700 border-green-200"
    };
    return map[priority] || "bg-gray-50 text-gray-600 border-gray-200";
  };

  const tabs = [
    { id: "Extraction", label: "Upload & Extract" },
    { id: "Relationships", label: "Pending Relationships" },
    { id: "Review", label: "Register Review" },
    { id: "Revisions", label: "Revision History" },
    { id: "Transmittals", label: "Email Transmittals" }
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-medium mb-1">
        <button onClick={() => router.push("/projects")} className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1">
          <ChevronLeft className="h-3 w-3" /> Back to Projects
        </button>
        <span className="text-slate-300">|</span>
        <span className="text-slate-400">Enterprise HRMS</span>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-400">Projects</span>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-600 font-semibold">{project.code}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FolderKanban className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                  {project.code}
                </span>
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", statusBadge(project.status))}>
                  {project.status}
                </span>
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border", priorityBadge(project.priority || "Low"))}>
                  {project.priority || "Low"}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4 text-slate-400" /> {project.client}</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-slate-400" /> {project.start_date} to {project.end_date || "TBD"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/projects/${id}/kani`)}
              className="px-4 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Mail className="h-4 w-4" /> Mini-Gmail Workspace
            </button>
            <button
              onClick={async () => {
                try {
                  const { exportProjectRegister } = await import("@/lib/api/register_ai");
                  const blob = await exportProjectRegister(id, register?.id);
                  const url = window.URL.createObjectURL(blob);
                  const a = window.document.createElement("a");
                  a.href = url;
                  a.download = `${project.code}_register${register ? `_V${register.version_number}` : ""}.xlsx`;
                  window.document.body.appendChild(a);
                  a.click();
                  window.document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                } catch (e) {
                  console.error("Export failed", e);
                  alert("Failed to export register. Please try again.");
                }
              }}
              className="px-4 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" /> Export Register
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" /> Edit Project
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content: Conditional Rendering */}
      <div className="min-h-[50vh] pt-4">
        {activeTab === "Extraction" && <AIRegisterTab project={project} />}

        {activeTab === "Relationships" && (
          <RelationshipConfirmation
            projectId={project.id}
            onAllConfirmed={() => {
              fetchRegisterData();
              handleTabChange("Review"); // Auto-switch to review when relationships confirmed
            }}
          />
        )}

        {activeTab === "Review" && register ? (
          <RegisterReview
            projectId={id}
            register={register}
            rows={rows}
            onUploadNew={() => {
              fetchRegisterData();
              handleTabChange("Revisions");
            }}
            onSaveSuccess={fetchRegisterData}
            activeSubmissionId={activeSubmissionId ?? ""}
            onGoToExtraction={() => handleTabChange("Extraction")}
          />
        ) : activeTab === "Review" ? (
          <div className="p-10 text-center bg-white rounded-2xl shadow-sm border border-slate-200 max-w-lg mx-auto my-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">No Register Generated Yet</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                This project does not have a generated register yet. Upload a structural drawing ZIP package to extract details and generate the register.
              </p>
            </div>
            <button
              onClick={() => handleTabChange("Extraction")}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors inline-flex items-center gap-2"
            >
              Go to Upload & Extract
            </button>
          </div>
        ) : null}

        {activeTab === "Revisions" && <RevisionManagementTab projectId={project.id} />}
        {activeTab === "Transmittals" && (
          <TransmittalTab
            project={project}
            projectId={project.id}
            onGoToReview={() => handleTabChange("Review")}
          />
        )}
      </div>

      {/* Edit Project Modal */}
      {project && (
        <EditProjectModal
          project={project}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updated) => onProjectUpdated(updated)}
        />
      )}
    </div>
  );
}

interface EditProjectModalProps {
  project: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: any) => void;
}

function EditProjectModal({ project, isOpen, onClose, onSave }: EditProjectModalProps) {
  const [name, setName] = useState(project.name || "");
  const [code, setCode] = useState(project.code || "");
  const [client, setClient] = useState(project.client || "");
  const [status, setStatus] = useState(project.status || "Active");
  const [priority, setPriority] = useState(project.priority || "Low");
  const [startDate, setStartDate] = useState(project.start_date || "");
  const [endDate, setEndDate] = useState(project.end_date || "");
  const [mailTo, setMailTo] = useState(project.mail_to || "");
  const [mailCc, setMailCc] = useState(project.mail_cc || "");
  const [mailBcc, setMailBcc] = useState(project.mail_bcc || "");
  const [mailNumber, setMailNumber] = useState(project.mail_number || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { default: apiClient } = await import("@/lib/api/client");
      const res = await apiClient.patch(`/api/v1/projects/${project.id}/`, {
        name,
        code,
        client,
        status,
        priority,
        start_date: startDate || null,
        end_date: endDate || null,
        mail_to: mailTo,
        mail_cc: mailCc,
        mail_bcc: mailBcc,
        mail_number: mailNumber
      });
      onSave(res.data);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to update project. Check fields.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-lg">Edit Project Details</h3>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Project Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Client Name *</label>
              <input
                type="text"
                required
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="At Risk">At Risk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={endDate || ""}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Default To (Comma separated)</label>
              <input
                type="text"
                value={mailTo}
                onChange={(e) => setMailTo(e.target.value)}
                placeholder="e.g. client@company.com, lead@company.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Default CC (Comma separated)</label>
              <input
                type="text"
                value={mailCc}
                onChange={(e) => setMailCc(e.target.value)}
                placeholder="e.g. mathan@email.com, check@email.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Default BCC (Comma separated)</label>
              <input
                type="text"
                value={mailBcc}
                onChange={(e) => setMailBcc(e.target.value)}
                placeholder="e.g. archive@jasper.ae"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mail Number (Fixed Ref Prefix)</label>
              <input
                type="text"
                value={mailNumber}
                onChange={(e) => setMailNumber(e.target.value)}
                placeholder="e.g. MAIL-001"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-sm"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
