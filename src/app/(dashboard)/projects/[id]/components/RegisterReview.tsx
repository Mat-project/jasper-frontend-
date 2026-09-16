"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  Check,
  Download,
  ShieldCheck,
  Award,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  MoreHorizontal,
  Upload,
  ArrowUpRight,
  Circle,
  FileText,
  RefreshCcw,
  Ban,
} from "lucide-react";
import { Register, RegisterRow, updateWorkspace } from "@/lib/api/register_ai";
import ActiveSubmissionBanner from "./ActiveSubmissionBanner";
import { useProjectWorkspace } from "../WorkspaceProvider";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    Error: "bg-red-50 text-red-700 border-red-200",
    Critical: "bg-red-100 text-red-800 border-red-300",
    Warning: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold border uppercase tracking-wide ${
        map[severity] ?? "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {severity}
    </span>
  );
}

function ValidationIcon({ status }: { status: string }) {
  if (status === "Passed")
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "Failed") return <XCircle className="h-4 w-4 text-red-600" />;
  return <AlertTriangle className="h-4 w-4 text-amber-500" />;
}

function RowStatusBadge({ status }: { status?: string }) {
  const s = (status || "NEW").toUpperCase();
  if (s === "REVISED")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <RefreshCcw className="h-2.5 w-2.5" /> REV
      </span>
    );
  if (s === "CANCELLED" || s === "SUPERSEDED")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
        <Ban className="h-2.5 w-2.5" /> VOID
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <Circle className="h-2 w-2 fill-emerald-500" /> NEW
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RegisterReview({
  projectId,
  register,
  rows,
  onUploadNew,
  onSaveSuccess,
  activeSubmissionId,
  onGoToExtraction,
}: {
  projectId: string;
  register: Register;
  rows: RegisterRow[];
  onUploadNew: () => void;
  onSaveSuccess?: () => void;
  activeSubmissionId: string;
  onGoToExtraction?: () => void;
}) {
  const [editableRows, setEditableRows] = useState<RegisterRow[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showAllExceptions, setShowAllExceptions] = useState(false);
  const [regState, setRegState] = useState<any>(register);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Shared workspace context
  const { activeSubmissionId: sharedActiveSubmissionId } = useProjectWorkspace();

  // Submissions (ZIP Batches) for filtering
  const [selectedSubmission, setSelectedSubmission] = useState("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Sync regState with prop changes
  useEffect(() => {
    setRegState(register);
  }, [register]);

  // Sync with prop changes (e.g. initial load or post-save refetch)
  useEffect(() => {
    setEditableRows(rows);
    setDeletedIds([]);
  }, [rows]);

  // Default the local selector to the shared active submission.
  useEffect(() => {
    const sharedId = sharedActiveSubmissionId || activeSubmissionId;
    if (sharedId && !selectedSubmission) {
      setSelectedSubmission(sharedId);
    }
  }, [activeSubmissionId, sharedActiveSubmissionId, selectedSubmission]);

  // Follow the shared active submission when it changes
  useEffect(() => {
    if (!sharedActiveSubmissionId || submissions.length === 0) return;
    const exists = submissions.some((s) => s.id === sharedActiveSubmissionId);
    if (exists && selectedSubmission !== sharedActiveSubmissionId) {
      setSelectedSubmission(sharedActiveSubmissionId);
    }
  }, [sharedActiveSubmissionId, submissions, selectedSubmission]);

  useEffect(() => {
    async function fetchSubmissions() {
      setLoadingSubmissions(true);
      try {
        const { default: apiClient } = await import("@/lib/api/client");
        const res = await apiClient.get(`/api/v1/projects/${projectId}/submissions/`);
        let data = res.data;
        if (data && typeof data === "object" && "results" in data) {
          data = data.results;
        }
        setSubmissions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load submissions in RegisterReview", err);
      } finally {
        setLoadingSubmissions(false);
      }
    }
    fetchSubmissions();
  }, [projectId]);

  // Update workspace current_stage to "Review" on mount
  useEffect(() => {
    async function updateWorkspaceStage() {
      try {
        await updateWorkspace(projectId, { current_stage: "Review" });
      } catch (error) {
        console.error("Failed to update workspace stage:", error);
      }
    }
    updateWorkspaceStage();
  }, [projectId]);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // visibleRows: filter by submission, then by search query, sorted by drawing_number
  const baseRows = selectedSubmission
    ? editableRows.filter((r) => r.zip_package === selectedSubmission)
    : editableRows;

  const visibleRows = baseRows
    .filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (r.drawing_number || "").toLowerCase().includes(q) ||
        (r.drawing_title || "").toLowerCase().includes(q) ||
        (r.bbs_numbers || "").toLowerCase().includes(q)
      );
    })
    .slice()
    .sort((a, b) => {
      const aNum = a.drawing_number || "";
      const bNum = b.drawing_number || "";
      return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: "base" });
    });

  const effectiveActiveSubmissionId = sharedActiveSubmissionId || activeSubmissionId;
  const isReadOnly = selectedSubmission !== effectiveActiveSubmissionId;

  const allExceptions = register.validation_report?.exceptions ?? [];
  const filteredExceptions = selectedSubmission
    ? allExceptions.filter((ex) => {
        const subDwgNums = new Set(visibleRows.map((r) => r.drawing_number));
        return ex.drawing_number ? subDwgNums.has(ex.drawing_number) : false;
      })
    : allExceptions;

  const errors = filteredExceptions.filter(
    (e) => e.severity === "Error" || e.severity === "Critical"
  );
  const warnings = filteredExceptions.filter((e) => e.severity === "Warning");
  const validationStatus = register.validation_report?.status ?? "—";
  const visibleExceptions = showAllExceptions ? filteredExceptions : filteredExceptions.slice(0, 3);

  // ─── Dirty check ────────────────────────────────────────────────────────────
  const getIsDirty = () => {
    if (deletedIds.length > 0) return true;
    if (editableRows.length !== rows.length) return true;
    const originalMap = new Map(rows.map((r) => [r.id, r]));
    for (const r of editableRows) {
      if (r.id.startsWith("temp-")) return true;
      const orig = originalMap.get(r.id);
      if (!orig) return true;
      if (
        r.drawing_number !== orig.drawing_number ||
        r.drawing_title !== orig.drawing_title ||
        r.drawing_rev !== orig.drawing_rev ||
        r.bbs_numbers !== orig.bbs_numbers ||
        r.bbs_revs !== orig.bbs_revs ||
        r.total_weight !== orig.total_weight ||
        r.sheet_no !== orig.sheet_no ||
        r.drawn_by !== orig.drawn_by ||
        r.checked_by !== orig.checked_by ||
        r.section !== orig.section ||
        r.mail_no !== orig.mail_no ||
        r.remarks !== orig.remarks ||
        r.date !== orig.date
      ) {
        return true;
      }
    }
    return false;
  };
  const isDirty = getIsDirty();

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleCellChange = (rowId: string, field: keyof RegisterRow, value: any) => {
    setEditableRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    );
  };

  const handleAddRow = () => {
    const tempId = `temp-${Date.now()}`;
    const newRow: RegisterRow = {
      id: tempId,
      zip_package: selectedSubmission || undefined,
      drawing_number: "NEW-DWG",
      drawing_title: "",
      drawing_rev: "00",
      bbs_numbers: "",
      bbs_revs: "",
      total_weight: "",
      sheet_no: "",
      drawn_by: "",
      checked_by: "",
      section: "",
      date: "",
      mail_no: "",
      remarks: "",
      dynamic_fields: {},
      validation_exceptions: [],
    };
    setEditableRows((prev) => [...prev, newRow]);
    setExpandedRow(tempId);
    setShowMoreMenu(false);
  };

  const handleDeleteRow = (rowId: string) => {
    if (!rowId.startsWith("temp-")) {
      setDeletedIds((prev) => [...prev, rowId]);
    }
    setEditableRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const { bulkSaveRegisterRows } = await import("@/lib/api/register_ai");
      const originalMap = new Map(rows.map((r) => [r.id, r]));
      const modifiedOrNew = editableRows.filter((r) => {
        if (r.id.startsWith("temp-")) return true;
        const orig = originalMap.get(r.id);
        if (!orig) return true;
        return (
          r.drawing_number !== orig.drawing_number ||
          r.drawing_title !== orig.drawing_title ||
          r.drawing_rev !== orig.drawing_rev ||
          r.bbs_numbers !== orig.bbs_numbers ||
          r.bbs_revs !== orig.bbs_revs ||
          r.total_weight !== orig.total_weight ||
          r.sheet_no !== orig.sheet_no ||
          r.drawn_by !== orig.drawn_by ||
          r.checked_by !== orig.checked_by ||
          r.section !== orig.section ||
          r.mail_no !== orig.mail_no ||
          r.remarks !== orig.remarks ||
          r.date !== orig.date
        );
      });

      await bulkSaveRegisterRows(projectId, register.id, {
        upsert_rows: modifiedOrNew,
        delete_row_ids: deletedIds,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      onSaveSuccess?.();
    } catch (error) {
      console.error("Failed to save changes:", error);
      alert("Error saving manual register changes. Please verify field data.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Project Name", "Status", "Drawing Number", "Rev", "Description",
      "Sheet", "BBS Reference Number", "Rev", "Weight/Qty",
    ];
    const csvRows = visibleRows.map((row) => {
      const status = row.dynamic_fields?.status || "NEW";
      const formatRevision = (rev: string) => {
        if (!rev) return "";
        const trimmed = rev.trim();
        if (/^\d+$/.test(trimmed)) {
          return trimmed.padStart(2, "0");
        }
        return trimmed;
      };
      return [
        `"${(row.drawing_title || "").replace(/"/g, '""')}"`,
        `"${status.replace(/"/g, '""')}"`,
        `"${(row.drawing_number || "").replace(/"/g, '""')}"`,
        `"${formatRevision(row.drawing_rev || "").replace(/"/g, '""')}"`,
        `"${(row.drawing_title || "").replace(/"/g, '""')}"`,
        `"${(row.sheet_no || "").replace(/"/g, '""')}"`,
        `"${(row.bbs_numbers || "").replace(/"/g, '""')}"`,
        `"${formatRevision(row.bbs_revs || "").replace(/"/g, '""')}"`,
        `"${row.total_weight ?? ""}"`,
      ];
    });
    const csvContent = [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const subNo = submissions.find((s) => s.id === selectedSubmission)?.submission_no || "SUB";
    const filename = selectedSubmission
      ? `JASPER_DOCUMENT_REGISTER_v${register.version_number}_${subNo}.csv`
      : `JASPER_DOCUMENT_REGISTER_v${register.version_number}_Master.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApproveRegister = async () => {
    setApproving(true);
    try {
      const { default: apiClient } = await import("@/lib/api/client");
      const res = await apiClient.post(
        `/api/v1/projects/${projectId}/registers/${register.id}/approve/`,
        { notes: approvalNotes }
      );
      setRegState(res.data);
      setShowApproveModal(false);
      onSaveSuccess?.();
    } catch (err: any) {
      console.error("Failed to approve register", err);
      alert(err.response?.data?.error || "Failed to sign off register. Please try again.");
    } finally {
      setApproving(false);
    }
  };

  const scrollToFirstIssue = (type: "Error" | "Warning") => {
    const targetRow = editableRows.find((r) =>
      r.validation_exceptions?.some((e) =>
        type === "Error" ? e.severity === "Error" || e.severity === "Critical" : e.severity === "Warning"
      )
    );
    if (targetRow) {
      setExpandedRow(targetRow.id);
      setTimeout(() => {
        const el = document.getElementById(`row-${targetRow.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-blue-400", "bg-blue-50/50");
          setTimeout(() => el.classList.remove("ring-2", "ring-blue-400", "bg-blue-50/50"), 2000);
        }
      }, 100);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <ActiveSubmissionBanner
        selectedSubmissionId={selectedSubmission || undefined}
        selectedSubmissionNo={submissions.find((s) => s.id === selectedSubmission)?.submission_no}
      />

      {/* ── Approval / Draft Banner ── */}
      {regState?.is_approved ? (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-emerald-900">Document Register Formally Approved</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-200 text-emerald-800 rounded-full">
                  Ready for Transmittal
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                Signed off by{" "}
                <span className="font-semibold">{regState.approved_by_name || "Checker / Manager"}</span>{" "}
                on {regState.approved_at ? new Date(regState.approved_at).toLocaleString() : new Date().toLocaleDateString()}
                {regState.approval_notes ? ` — "${regState.approval_notes}"` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-xs">
            <Award className="h-4 w-4 text-emerald-600" />
            V{regState.version_number} Certified
          </div>
        </div>
      ) : (
        <div className="bg-amber-50/70 border border-amber-200/80 text-amber-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Review in Progress:</span> Verify drawing numbers and BBS weights below. Formally sign off before client transmittal dispatch.
            </p>
          </div>
          {!isReadOnly && (
            <button
              onClick={() => setShowApproveModal(true)}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200/80 px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ml-4"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
              Sign Off
            </button>
          )}
        </div>
      )}

      {/* ── Archived Read-Only Banner ── */}
      {isReadOnly && (
        <div className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Archived Submission — Read Only</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Select today&apos;s active submission from the dropdown above to make edits.
            </p>
          </div>
        </div>
      )}

      {/* ── Page Header: Title + Primary Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
            Register Review
            <span className="text-slate-400 font-normal text-base">v{register.version_number}</span>
            {regState?.is_approved ? (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Approved
              </span>
            ) : (
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                Draft
              </span>
            )}
            {isDirty && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-semibold animate-pulse">
                Unsaved Changes
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Generated {new Date(register.generated_at).toLocaleString()} · Click any row to expand details and edit secondary fields
          </p>
        </div>

        {/* Primary action buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Save Changes (only when dirty) */}
          {!isReadOnly && isDirty && (
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              {isSaving ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saveSuccess ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
            </button>
          )}

          {/* Approve Register */}
          {!isReadOnly && !regState?.is_approved && (
            <button
              onClick={() => setShowApproveModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-100" />
              Approve
            </button>
          )}

          {/* Download CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            <Download className="h-4 w-4 text-emerald-50" />
            Download CSV
          </button>

          {/* More dropdown */}
          {!isReadOnly && (
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu((p) => !p)}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
                  <button
                    onClick={handleAddRow}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left transition-colors"
                  >
                    <Plus className="h-4 w-4 text-blue-600" />
                    Add Row
                  </button>
                  <button
                    onClick={() => { onUploadNew(); setShowMoreMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left transition-colors"
                  >
                    <Upload className="h-4 w-4 text-slate-500" />
                    Upload New Revision
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Compact Stats Strip ── */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 flex-wrap">
        <span className="flex items-center gap-1.5">
          <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-bold text-slate-800">{editableRows.length}</span> rows total
        </span>
        <span className="text-slate-300">|</span>
        <button
          onClick={() => errors.length > 0 && scrollToFirstIssue("Error")}
          className={cn(
            "flex items-center gap-1.5 transition-colors",
            errors.length > 0 ? "text-red-600 font-semibold cursor-pointer hover:underline" : "text-emerald-600"
          )}
        >
          {errors.length > 0 ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          <span className="font-bold">{errors.length}</span> {errors.length === 1 ? "error" : "errors"}
        </button>
        <button
          onClick={() => warnings.length > 0 && scrollToFirstIssue("Warning")}
          className={cn(
            "flex items-center gap-1.5 transition-colors",
            warnings.length > 0 ? "text-amber-600 font-semibold cursor-pointer hover:underline" : "text-emerald-600"
          )}
        >
          {warnings.length > 0 ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          <span className="font-bold">{warnings.length}</span> {warnings.length === 1 ? "warning" : "warnings"}
        </button>
        <span className="text-slate-300">|</span>
        <span className={cn("flex items-center gap-1.5 font-semibold", validationStatus === "Passed" ? "text-emerald-600" : "text-red-600")}>
          <ValidationIcon status={validationStatus} />
          Validation: {validationStatus}
        </span>
      </div>

      {/* ── Validation Report (only shown if there are issues) ── */}
      {register.validation_report && filteredExceptions.length > 0 && (
        <div className={`border rounded-xl p-4 ${validationStatus === "Passed" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <p className="font-bold text-gray-900 text-sm mb-2">
            Validation Report:{" "}
            <span className={validationStatus === "Passed" ? "text-emerald-700" : "text-red-700"}>
              {validationStatus}
            </span>
            <span className="text-slate-400 font-normal text-xs ml-2">
              {filteredExceptions.length} exception(s)
            </span>
          </p>
          <div className="space-y-2">
            {visibleExceptions.map((ex) => (
              <div key={ex.id} className="flex items-start gap-3 bg-white/60 border border-white/80 rounded-lg px-3 py-2">
                <SeverityBadge severity={ex.severity} />
                <div>
                  <p className="text-xs font-bold text-slate-600">{ex.rule_name}</p>
                  <p className="text-xs text-slate-700 mt-0.5">{ex.message}</p>
                </div>
              </div>
            ))}
            {filteredExceptions.length > 3 && (
              <button
                onClick={() => setShowAllExceptions((p) => !p)}
                className="text-xs text-blue-600 hover:underline mt-1 cursor-pointer"
              >
                {showAllExceptions ? "Show fewer" : `Show ${filteredExceptions.length - 3} more`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Approve Register Modal ── */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Formally Approve Register</h4>
                  <p className="text-xs text-slate-500">Sign off Register Version {register.version_number}</p>
                </div>
              </div>
              <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <p className="font-semibold text-slate-800">Sign-off Confirmation:</p>
              <p>• All drawing numbers, BBS references, and tonnages are verified.</p>
              <p>• This register version will be certified for client transmittal dispatch.</p>
              <p>• An audit log entry with your credentials will be recorded.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Sign-off Notes / Remarks (Optional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="e.g. Verified against architectural IFC set. Ready for client submission."
                className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none h-20"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowApproveModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                disabled={approving}
                onClick={handleApproveRegister}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {approving ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {approving ? "Certifying..." : "Confirm & Sign Off"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Register Rows Table ── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        {/* Table toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drawing no., title, BBS ref..."
              className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Submission Filter */}
            <select
              value={selectedSubmission}
              onChange={(e) => setSelectedSubmission(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium outline-none cursor-pointer focus:border-blue-400 focus:ring-1 focus:ring-blue-400 max-w-[220px] truncate"
            >
              <option value="">All Submissions</option>
              {submissions.map((sub) => {
                const fname =
                  sub.original_filename.length > 28
                    ? sub.original_filename.substring(0, 25) + "..."
                    : sub.original_filename;
                return (
                  <option key={sub.id} value={sub.id}>
                    {sub.submission_no} — {fname}
                  </option>
                );
              })}
            </select>

            {/* Row count */}
            <span className="text-[11px] text-slate-400 font-semibold bg-slate-100 border border-slate-200 px-2 py-1 rounded whitespace-nowrap">
              {visibleRows.length} / {editableRows.length}
            </span>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-100/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2">Drawing No.</div>
          <div className="col-span-4">Drawing Title</div>
          <div className="col-span-2">BBS Reference</div>
          <div className="col-span-1 text-right">Weight (kg)</div>
          <div className="col-span-1 text-center">Issues</div>
          <div className="col-span-1 text-center">Details</div>
        </div>

        {/* Rows */}
        {visibleRows.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-slate-200" />
            {searchQuery ? (
              <>
                <p className="text-sm font-semibold text-slate-500">No rows match &ldquo;{searchQuery}&rdquo;</p>
                <p className="text-xs text-slate-400 mt-1">Try a different drawing number or title</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 text-xs text-blue-600 hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-500">No register rows found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Select a different submission or generate the register first
                </p>
                {onGoToExtraction && (
                  <button
                    onClick={onGoToExtraction}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Go to Extraction <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleRows.map((row) => {
              const isExpanded = expandedRow === row.id;
              const rowErrors =
                row.validation_exceptions?.filter(
                  (e) => e.severity === "Error" || e.severity === "Critical"
                ) ?? [];
              const rowWarnings =
                row.validation_exceptions?.filter((e) => e.severity === "Warning") ?? [];
              const hasIssues = (row.validation_exceptions?.length ?? 0) > 0;
              const rowStatus = row.dynamic_fields?.status;

              return (
                <div
                  key={row.id}
                  id={`row-${row.id}`}
                  className={cn(
                    "transition-all duration-200",
                    hasIssues ? "border-l-4 border-l-rose-400" : "border-l-4 border-l-transparent"
                  )}
                >
                  {/* Main row */}
                  <div
                    className={cn(
                      "grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-sm cursor-pointer select-none",
                      isExpanded ? "bg-blue-50/40" : "hover:bg-slate-50/80"
                    )}
                    onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                  >
                    {/* Status badge */}
                    <div className="col-span-1 flex justify-center">
                      <RowStatusBadge status={rowStatus} />
                    </div>

                    {/* Drawing Number */}
                    <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={row.drawing_number}
                        onChange={(e) => handleCellChange(row.id, "drawing_number", e.target.value)}
                        className="w-full bg-transparent border border-transparent focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/30 hover:bg-white/80 px-2 py-1 rounded font-mono text-xs font-bold text-blue-700 outline-none transition-all"
                        title={row.drawing_number}
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Drawing Title */}
                    <div className="col-span-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={row.drawing_title || ""}
                        onChange={(e) => handleCellChange(row.id, "drawing_title", e.target.value)}
                        className="w-full bg-transparent border border-transparent focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/30 hover:bg-white/80 px-2 py-1 rounded text-xs font-medium text-slate-800 outline-none transition-all"
                        placeholder="Drawing Title..."
                        title={row.drawing_title || ""}
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* BBS Reference */}
                    <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={row.bbs_numbers || ""}
                        onChange={(e) => handleCellChange(row.id, "bbs_numbers", e.target.value)}
                        className="w-full bg-transparent border border-transparent focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/30 hover:bg-white/80 px-2 py-1 rounded font-mono text-xs text-slate-600 outline-none transition-all"
                        placeholder="—"
                        title={row.bbs_numbers || "No BBS"}
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Weight */}
                    <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={row.total_weight || ""}
                        onChange={(e) => handleCellChange(row.id, "total_weight", e.target.value)}
                        className="w-full bg-transparent border border-transparent focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/30 hover:bg-white/80 px-2 py-1 rounded text-right text-xs font-semibold text-slate-700 outline-none transition-all"
                        placeholder="—"
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Issues indicator */}
                    <div className="col-span-1 flex justify-center">
                      {rowErrors.length > 0 ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] font-bold text-red-700">
                          <XCircle className="h-3 w-3" /> {rowErrors.length}
                        </span>
                      ) : rowWarnings.length > 0 ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">
                          <AlertTriangle className="h-3 w-3" /> {rowWarnings.length}
                        </span>
                      ) : (
                        <span className="text-emerald-500" title="No issues">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>

                    {/* Expand / Delete */}
                    <div className="col-span-1 flex justify-center items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                        className="p-1 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700 transition-colors"
                        title={isExpanded ? "Collapse" : "Expand details"}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {!isReadOnly && (
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1 hover:bg-rose-100 rounded text-slate-300 hover:text-rose-600 transition-colors"
                          title="Delete row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Expanded detail panel ── */}
                  {isExpanded && (
                    <div className="border-t border-blue-100 bg-blue-50/30 px-6 py-5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                        Secondary Details — click any field to edit
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dwg Rev</label>
                          <input type="text" value={row.drawing_rev || ""} onChange={(e) => handleCellChange(row.id, "drawing_rev", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-blue-500 bg-white" placeholder="00" disabled={isReadOnly} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">BBS Rev</label>
                          <input type="text" value={row.bbs_revs || ""} onChange={(e) => handleCellChange(row.id, "bbs_revs", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-blue-500 bg-white" placeholder="—" disabled={isReadOnly} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sheet No.</label>
                          <input type="text" value={row.sheet_no || ""} onChange={(e) => handleCellChange(row.id, "sheet_no", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white" placeholder="e.g. 1 OF 8" disabled={isReadOnly} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Section</label>
                          <input type="text" value={row.section || ""} onChange={(e) => handleCellChange(row.id, "section", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white" placeholder="Section..." disabled={isReadOnly} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Drawn By</label>
                          <input type="text" value={row.drawn_by || ""} onChange={(e) => handleCellChange(row.id, "drawn_by", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white" placeholder="Name..." disabled={isReadOnly} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Checked By</label>
                          <input type="text" value={row.checked_by || ""} onChange={(e) => handleCellChange(row.id, "checked_by", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white" placeholder="Name..." disabled={isReadOnly} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                          <input type="date" value={row.date || ""} onChange={(e) => handleCellChange(row.id, "date", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white" disabled={isReadOnly} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mail No.</label>
                          <input type="text" value={row.mail_no || ""} onChange={(e) => handleCellChange(row.id, "mail_no", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white" placeholder="—" disabled={isReadOnly} />
                        </div>
                      </div>

                      {/* Remarks */}
                      <div className="mb-4">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks</label>
                        <textarea
                          value={row.remarks || ""}
                          onChange={(e) => handleCellChange(row.id, "remarks", e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white resize-none"
                          placeholder="Add remarks for this register row..."
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* Validation exceptions */}
                      {hasIssues ? (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Row Validation Issues
                          </p>
                          {row.validation_exceptions?.map((ex, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs bg-white/80 border border-slate-100 rounded-lg px-3 py-2">
                              <SeverityBadge severity={ex.severity} />
                              <span className="text-slate-600">{ex.message}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          No validation issues for this row.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
