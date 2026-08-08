"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Weight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  Check,
  Download,
  ShieldCheck,
  Award,
  X,
  Sparkles
} from "lucide-react";
import { Register, RegisterRow, updateWorkspace } from "@/lib/api/register_ai";
import ActiveSubmissionBanner from "./ActiveSubmissionBanner";
import { useProjectWorkspace } from "../WorkspaceProvider";

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
    return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (status === "Failed") return <XCircle className="h-5 w-5 text-red-600" />;
  return <AlertTriangle className="h-5 w-5 text-amber-500" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RegisterReview({
  projectId,
  register,
  rows,
  onUploadNew,
  onSaveSuccess,
  activeSubmissionId,
}: {
  projectId: string;
  register: Register;
  rows: RegisterRow[];
  onUploadNew: () => void;
  onSaveSuccess?: () => void;
  activeSubmissionId: string;
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

  // Shared workspace context — used for the Active Submission banner and to
  // keep the local submission selector in sync with the rest of the tabs.
  const { activeSubmissionId: sharedActiveSubmissionId, activeSubmissionNo } = useProjectWorkspace();

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

  // Default the local selector to the shared active submission. The prop
  // (sourced from the same context by the page) is kept for backward
  // compatibility, but the shared context is the authoritative source.
  useEffect(() => {
    const sharedId = sharedActiveSubmissionId || activeSubmissionId;
    if (sharedId && !selectedSubmission) {
      setSelectedSubmission(sharedId);
    }
  }, [activeSubmissionId, sharedActiveSubmissionId, selectedSubmission]);

  // Follow the shared active submission when it changes (e.g. after a new ZIP
  // completes or the user switches submission in another tab), as long as the
  // user hasn't deliberately picked a different historical submission here.
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
        if (data && typeof data === 'object' && 'results' in data) {
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

  // visibleRows filtered by submission selector, sorted by drawing_number
  // ascending so drawings appear in proper sequential order (e.g. B5-025,
  // B5-026, B5-027, ...) instead of random insertion order.
  const visibleRows = (selectedSubmission
    ? editableRows.filter(r => r.zip_package === selectedSubmission)
    : editableRows
  ).slice().sort((a, b) => {
    const aNum = a.drawing_number || "";
    const bNum = b.drawing_number || "";
    return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: "base" });
  });

  // Read-only when viewing a historical (non-active) submission. The shared
  // workspace context is the authoritative source of the active submission.
  const effectiveActiveSubmissionId = sharedActiveSubmissionId || activeSubmissionId;
  const isReadOnly = selectedSubmission !== effectiveActiveSubmissionId;

  const allExceptions = register.validation_report?.exceptions ?? [];
  
  // Filter exceptions only to the ones belonging to the selected submission's drawings
  const filteredExceptions = selectedSubmission
    ? allExceptions.filter(ex => {
        const subDwgNums = new Set(visibleRows.map(r => r.drawing_number));
        return ex.drawing_number ? subDwgNums.has(ex.drawing_number) : false;
      })
    : allExceptions;

  const errors = filteredExceptions.filter(
    (e) => e.severity === "Error" || e.severity === "Critical"
  );
  const warnings = filteredExceptions.filter((e) => e.severity === "Warning");
  const validationStatus = register.validation_report?.status ?? "—";
  const visibleExceptions = showAllExceptions ? filteredExceptions : filteredExceptions.slice(0, 3);

  const handleExportCSV = () => {
    const headers = [
      "S.No.",
      "DRAWING NUMBER",
      "DRAWING TITLE",
      "SHEET",
      "BBS NO",
      "FINAL-REV",
      "WEIGHT",
      "DATE",
      "MAIL No.",
      "STATUS",
      "DRAWN BY",
      "SHEET SIZE"
    ];
    
    const csvRows = visibleRows.map((row, index) => {
      const status = row.dynamic_fields?.status || "NEW";
      const sheetSize = row.dynamic_fields?.sheet_size || "A1";
      
      return [
        `"${index + 1}"`,
        `"${(row.drawing_number || '').replace(/"/g, '""')}"`,
        `"${(row.drawing_title || '').replace(/"/g, '""')}"`,
        `"${(row.sheet_no || '').replace(/"/g, '""')}"`,
        `"${(row.bbs_numbers || '').replace(/"/g, '""')}"`,
        `"${(row.drawing_rev || '').replace(/"/g, '""')}"`,
        `"${row.total_weight ?? ''}"`,
        `"${(row.date || '').replace(/"/g, '""')}"`,
        `"${(row.mail_no || '').replace(/"/g, '""')}"`,
        `"${status.replace(/"/g, '""')}"`,
        `"${(row.drawn_by || '').replace(/"/g, '""')}"`,
        `"${sheetSize.replace(/"/g, '""')}"`
      ];
    });
    
    const csvContent = [
      headers.join(","),
      ...csvRows.map(e => e.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const filename = selectedSubmission 
      ? `JASPER_DOCUMENT_REGISTER_v${register.version_number}_${subMap.get(selectedSubmission) || 'SUB'}.csv`
      : `JASPER_DOCUMENT_REGISTER_v${register.version_number}_Master.csv`;
      
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check if any row has changed or a new row has been added/deleted
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
      validation_exceptions: []
    };
    setEditableRows((prev) => [...prev, newRow]);
    setExpandedRow(tempId);
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

  const scrollToFirstIssue = (type: "Error" | "Warning") => {
    const targetRow = editableRows.find(r => 
      r.validation_exceptions?.some(e => 
        type === "Error" ? (e.severity === "Error" || e.severity === "Critical") : e.severity === "Warning"
      )
    );
    if (targetRow) {
      setExpandedRow(targetRow.id);
      setTimeout(() => {
        const el = document.getElementById(`row-${targetRow.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50/50');
          setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50/50'), 2000);
        }
      }, 100);
    }
  };

  const handleApproveRegister = async () => {
    setApproving(true);
    try {
      const { default: apiClient } = await import("@/lib/api/client");
      const res = await apiClient.post(`/api/v1/projects/${projectId}/registers/${register.id}/approve/`, {
        notes: approvalNotes
      });
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

  return (
    <div className="space-y-6">
      <ActiveSubmissionBanner
        selectedSubmissionId={selectedSubmission || undefined}
        selectedSubmissionNo={
          submissions.find((s) => s.id === selectedSubmission)?.submission_no
        }
      />

      {/* Approval Status Alert Banner */}
      {regState?.is_approved ? (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center justify-between shadow-sm">
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
                Signed off by <span className="font-semibold">{regState.approved_by_name || "Checker / Manager"}</span> on{" "}
                {regState.approved_at ? new Date(regState.approved_at).toLocaleString() : new Date().toLocaleDateString()}
                {regState.approval_notes ? ` — "${regState.approval_notes}"` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">
            <Award className="h-4 w-4 text-emerald-600" />
            V{regState.version_number} Certified
          </div>
        </div>
      ) : (
        <div className="bg-amber-50/70 border border-amber-200/80 text-amber-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Review in Progress:</span> Verify drawing numbers and BBS weights below. A formal sign-off is recommended before client transmittal dispatch.
            </p>
          </div>
          {!isReadOnly && (
            <button
              onClick={() => setShowApproveModal(true)}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200/80 px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
              Sign Off / Approve
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Register Review{" "}
            <span className="text-slate-400 font-normal text-base">
              v{register.version_number}
            </span>
            {regState?.is_approved ? (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Approved
              </span>
            ) : (
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                Draft (Pending Sign-off)
              </span>
            )}
            {isDirty && (
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-semibold animate-pulse">
                Unsaved Changes
              </span>
            )}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Generated on{" "}
            {new Date(register.generated_at).toLocaleString()}. Double-click any cell to manually correct values or add/delete rows below.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isReadOnly && (
            <>
              <button
                onClick={handleAddRow}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus className="h-4 w-4 text-blue-600" />
                Add Row
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={!isDirty || isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                  isDirty
                    ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                }`}
              >
                {isSaving ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
              </button>
            </>
          )}

          {!isReadOnly && !regState?.is_approved && (
            <button
              onClick={() => setShowApproveModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all cursor-pointer"
              title="Sign off and certify this register version"
            >
              <ShieldCheck className="h-4 w-4 text-blue-100" />
              Approve Register
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transform transition-all active:scale-95"
            title="Download cumulative register as CSV"
          >
            <Download className="h-5 w-5 text-emerald-50" />
            Download Register (CSV)
          </button>
          {!isReadOnly && (
            <button
              onClick={onUploadNew}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Upload New Revision
            </button>
          )}
        </div>
      </div>

      {/* Approve Register Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-in">
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
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
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
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
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

      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Archived Submission [Read-Only]</p>
            <p className="text-xs text-amber-700 mt-1">
              You are viewing a historical submission. Edits, additions, and deletions are disabled. To make modifications, select today&apos;s active workspace submission from the dropdown.
            </p>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{editableRows.length}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Total Rows</p>
        </div>
        <div
          onClick={() => errors.length > 0 && scrollToFirstIssue("Error")}
          className={`border rounded-xl p-4 text-center cursor-pointer transition-colors ${
            errors.length > 0
              ? "bg-red-50 border-red-200 hover:bg-red-100"
              : "bg-emerald-50 border-emerald-200"
          }`}
        >
          <p
            className={`text-3xl font-bold ${
              errors.length > 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {errors.length}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Errors</p>
        </div>
        <div
          onClick={() => warnings.length > 0 && scrollToFirstIssue("Warning")}
          className={`border rounded-xl p-4 text-center cursor-pointer transition-colors ${
            warnings.length > 0
              ? "bg-amber-50 border-amber-200 hover:bg-amber-100"
              : "bg-emerald-50 border-emerald-200"
          }`}
        >
          <p
            className={`text-3xl font-bold ${
              warnings.length > 0 ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            {warnings.length}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Warnings</p>
        </div>
      </div>

      {/* Validation report panel */}
      {register.validation_report && (
        <div
          className={`border rounded-xl p-5 ${
            validationStatus === "Passed"
              ? "bg-emerald-50 border-emerald-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <ValidationIcon status={validationStatus} />
            <div>
              <p className="font-bold text-gray-900 text-sm">
                Validation Report:{" "}
                <span
                  className={
                    validationStatus === "Passed"
                      ? "text-emerald-700"
                      : "text-red-700"
                  }
                >
                  {validationStatus}
                </span>
              </p>
              {allExceptions.length === 0 ? (
                <p className="text-xs text-emerald-600 mt-0.5">
                  All business rules passed — no exceptions found.
                </p>
              ) : (
                <p className="text-xs text-red-600 mt-0.5">
                  {allExceptions.length} exception(s) found. Review below.
                </p>
              )}
            </div>
          </div>

          {allExceptions.length > 0 && (
            <div className="space-y-2 mt-3">
              {visibleExceptions.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-start gap-3 bg-white/60 border border-white/80 rounded-lg px-3 py-2"
                >
                  <SeverityBadge severity={ex.severity} />
                  <div>
                    <p className="text-xs font-bold text-slate-600">{ex.rule_name}</p>
                    <p className="text-xs text-slate-700 mt-0.5">{ex.message}</p>
                  </div>
                </div>
              ))}
              {allExceptions.length > 3 && (
                <button
                  onClick={() => setShowAllExceptions((p) => !p)}
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  {showAllExceptions
                    ? "Show fewer"
                    : `Show ${allExceptions.length - 3} more`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Register rows table (Excel Layout scrollable horizontally) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-4 w-4 text-slate-500" />
            <p className="font-semibold text-slate-700 text-sm">Register Rows</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Filter by Submission Select Dropdown */}
            <select
              value={selectedSubmission}
              onChange={(e) => setSelectedSubmission(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium outline-none cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- All Submissions --</option>
              {submissions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.submission_no} - {sub.original_filename}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              Interactive Sheet
            </span>
          </div>
        </div>

        {visibleRows.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No register rows found for the selected view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1500px] divide-y divide-slate-100">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 items-center">
                <div className="col-span-1 flex items-center justify-center">Actions</div>
                <div className="col-span-1">Dwg No</div>
                <div className="col-span-2">Drawing Title</div>
                <div className="col-span-1">BBS No</div>
                <div className="col-span-1">Weight</div>
                <div className="col-span-1">Sheet</div>
                <div className="col-span-1">Dwg Rev</div>
                <div className="col-span-1">BBS Rev</div>
                <div className="col-span-1">Drawn By</div>
                <div className="col-span-1">Checked By</div>
                <div className="col-span-1">Section</div>
              </div>

              {visibleRows.map((row, index) => {
                const isExpanded = expandedRow === row.id;
                const hasIssues = (row.validation_exceptions?.length ?? 0) > 0;

                return (
                  <div key={row.id} id={`row-${row.id}`} className="transition-all duration-300">
                    <div
                      className={`grid grid-cols-12 gap-3 px-5 py-2.5 items-center text-xs border-l-4 ${
                        hasIssues 
                          ? "border-l-rose-500 bg-rose-50/10" 
                          : "border-l-transparent hover:bg-slate-50/50"
                      } transition-colors`}
                    >
                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-center gap-1">
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                          title="View validation report details"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        {!isReadOnly && (
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Drawing Number */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={row.drawing_number}
                          onChange={(e) => handleCellChange(row.id, "drawing_number", e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500 hover:bg-slate-100/50 px-1 py-0.5 rounded font-mono text-[11px] outline-none text-slate-900"
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* Drawing Title */}
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={row.drawing_title || ""}
                          onChange={(e) => handleCellChange(row.id, "drawing_title", e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500 hover:bg-slate-100/50 px-1 py-0.5 rounded text-[11px] outline-none text-slate-800"
                          placeholder="Title..."
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* BBS Numbers */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={row.bbs_numbers || ""}
                          onChange={(e) => handleCellChange(row.id, "bbs_numbers", e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500 hover:bg-slate-100/50 px-1 py-0.5 rounded font-mono text-[11px] outline-none text-slate-800"
                          placeholder="BBS No..."
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* Total Weight */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={row.total_weight || ""}
                          onChange={(e) => handleCellChange(row.id, "total_weight", e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500 hover:bg-slate-100/50 px-1 py-0.5 rounded font-semibold text-[11px] outline-none text-slate-800"
                          placeholder="—"
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* Sheet */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={row.sheet_no || ""}
                          onChange={(e) => handleCellChange(row.id, "sheet_no", e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500 hover:bg-slate-100/50 px-1 py-0.5 rounded text-[11px] outline-none text-slate-700"
                          placeholder="e.g. 1 OF 8"
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* Dwg Rev */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={row.drawing_rev || ""}
                          onChange={(e) => handleCellChange(row.id, "drawing_rev", e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500 hover:bg-slate-100/50 px-1 py-0.5 rounded font-mono text-[11px] outline-none text-slate-700"
                          placeholder="00"
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* BBS Rev */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={row.bbs_revs || ""}
                          onChange={(e) => handleCellChange(row.id, "bbs_revs", e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500 hover:bg-slate-100/50 px-1 py-0.5 rounded font-mono text-[11px] outline-none text-slate-700"
                          placeholder="—"
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* Drawn By */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={row.drawn_by || ""}
                          onChange={(e) => handleCellChange(row.id, "drawn_by", e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500 hover:bg-slate-100/50 px-1 py-0.5 rounded text-[11px] outline-none text-slate-700"
                          placeholder="Drawn..."
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* Checked By */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={row.checked_by || ""}
                          onChange={(e) => handleCellChange(row.id, "checked_by", e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500 hover:bg-slate-100/50 px-1 py-0.5 rounded text-[11px] outline-none text-slate-700"
                          placeholder="Checked..."
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* Section */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={row.section || ""}
                          onChange={(e) => handleCellChange(row.id, "section", e.target.value)}
                          className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500 hover:bg-slate-100/50 px-1 py-0.5 rounded text-[11px] outline-none text-slate-700"
                          placeholder="Section..."
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>

                    {/* Expanded exceptions */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 space-y-4">
                        {/* Extended Fields Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</label>
                            <input type="date" value={row.date || ""} onChange={(e) => handleCellChange(row.id, "date", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500" disabled={isReadOnly} />
                          </div>
                        </div>

                        {/* Remarks Input */}
                        <div className="flex flex-col gap-1.5 max-w-4xl">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks</label>
                          <textarea
                            value={row.remarks || ""}
                            onChange={(e) => handleCellChange(row.id, "remarks", e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Add remarks for this register row..."
                            disabled={isReadOnly}
                          />
                        </div>

                        {/* Validation Exceptions List */}
                        {hasIssues ? (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Row Validation Issues
                            </p>
                            {row.validation_exceptions?.map((ex, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-xs"
                              >
                                <SeverityBadge severity={ex.severity} />
                                <span className="text-slate-600">{ex.message}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            No issues detected for this row.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
