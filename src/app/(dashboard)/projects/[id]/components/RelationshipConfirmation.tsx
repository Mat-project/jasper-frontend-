"use client";

import React, { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api/client";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Zap,
  FileText,
  Package,
  RefreshCw,
} from "lucide-react";
import {
  getRelationships,
  confirmRelationship,
  rejectRelationship,
  generateRegister,
} from "@/lib/api/register_ai";

// ─── Types ─────────────────────────────────────────────────────────────────────

// Flexible type that handles both old nested schema and Kausik's flat schema
interface RelationshipRecord {
  id: string;
  project?: string;
  zip_package?: string | null;
  confidence_score: string;
  status: string;
  // Flat fields (Kausik's new schema)
  drawing_number?: string | null;
  bbs_number?: string | null;
  extracted_details?: {
    drawing_revision?: string | null;
    bbs_revision?: string | null;
    total_weight?: string | null;
  };
  // Nested fields (legacy schema - handled defensively)
  drawing_files?: Array<{
    id: string;
    drawing_metadata?: {
      drawing_number?: string | null;
      revision?: string | null;
      title?: string | null;
      ai_confidence_score?: string | null;
    };
  }>;
  bbs_files?: Array<{
    id: string;
    bbs_metadata?: {
      bbs_number?: string | null;
      revision?: string | null;
      weight?: string | null;
      ai_confidence_score?: string | null;
    };
  }>;
  reviewed_at?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDrawingNumber(rel: RelationshipRecord): string {
  // Try flat field first (Kausik's schema)
  if (rel.drawing_number) return rel.drawing_number;
  // Fallback: nested drawing_files array
  const nums = (rel.drawing_files ?? [])
    .map((d) => d.drawing_metadata?.drawing_number)
    .filter(Boolean)
    .join(", ");
  return nums || "—";
}

function getBBSNumber(rel: RelationshipRecord): string {
  if (rel.bbs_number) return rel.bbs_number;
  const nums = (rel.bbs_files ?? [])
    .map((b) => b.bbs_metadata?.bbs_number)
    .filter(Boolean)
    .join(", ");
  return nums || "—";
}

function getDrawingRevision(rel: RelationshipRecord): string {
  if (rel.extracted_details?.drawing_revision) return rel.extracted_details.drawing_revision;
  return rel.drawing_files?.[0]?.drawing_metadata?.revision ?? "—";
}

function getBBSRevision(rel: RelationshipRecord): string {
  if (rel.extracted_details?.bbs_revision) return rel.extracted_details.bbs_revision;
  return rel.bbs_files?.[0]?.bbs_metadata?.revision ?? "—";
}

function getTotalWeight(rel: RelationshipRecord): string {
  const w = rel.extracted_details?.total_weight ?? rel.bbs_files?.[0]?.bbs_metadata?.weight;
  if (!w || w === "None" || w === "null") return "—";
  const num = parseFloat(w);
  return isNaN(num) ? "—" : `${num.toLocaleString()} kg`;
}

function isPending(status: string): boolean {
  return status === "Proposed" || status === "Pending";
}

function ConfidenceBar({ score }: { score: number }) {
  const normalized = score > 1 ? score / 100 : score;
  const pct = Math.round(normalized * 100);
  const color =
    pct >= 90 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-400" : pct >= 50 ? "bg-orange-500" : "bg-red-500";
  const textColor =
    pct >= 90 ? "text-emerald-700" : pct >= 70 ? "text-amber-700" : pct >= 50 ? "text-orange-700" : "text-red-700";
  const bgColor =
    pct >= 90
      ? "bg-emerald-50 border-emerald-200"
      : pct >= 70
      ? "bg-amber-50 border-amber-200"
      : pct >= 50
      ? "bg-orange-50 border-orange-200"
      : "bg-red-50 border-red-200";

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${bgColor}`}>
      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${textColor}`}>{pct}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Proposed: "bg-blue-50 text-blue-700 border-blue-200",
    Pending: "bg-blue-50 text-blue-700 border-blue-200",
    Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RelationshipConfirmation({
  projectId,
  onAllConfirmed,
}: {
  projectId: string;
  // relationships prop is intentionally removed — component owns its own data fetching
  onAllConfirmed?: () => void;
}) {
  const [relationships, setRelationships] = useState<RelationshipRecord[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({}); // relId -> "confirm"|"reject"
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Submissions (ZIP Batches)
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState("");
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  // ── Fetch Submissions ────────────────────────────────────────────────────────
  const fetchSubmissions = useCallback(async () => {
    setLoadingSubmissions(true);
    try {
      const res = await apiClient.get(`/api/v1/projects/${projectId}/submissions/`);
      let data = res.data;
      if (data && typeof data === 'object' && 'results' in data) {
        data = data.results;
      }
      const submissionsArray = Array.isArray(data) ? data : [];
      const sorted = submissionsArray.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSubmissions(sorted);
      if (sorted && sorted.length > 0) {
        setSelectedSubmission(sorted[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch submissions", err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [projectId]);

  // ── Fetch relationships ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setFetchLoading(true);
    setFetchError(null);
    try {
      const data = await getRelationships(projectId);
      // Ensure we always set an array, even if API returns null/undefined
      setRelationships(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load relationships.";
      setFetchError(msg);
      setRelationships([]);
    } finally {
      setFetchLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
    fetchSubmissions();
    // Re-fetch when zip processing completes
    const handleZipDone = () => {
      fetchData();
      fetchSubmissions();
    };
    window.addEventListener("zip-processing-completed", handleZipDone);
    return () => window.removeEventListener("zip-processing-completed", handleZipDone);
  }, [fetchData, fetchSubmissions]);

  // ── Derived state filtered by selected submission ───────────────────────────
  const filteredRelationships = relationships.filter(
    (r) => !selectedSubmission || r.zip_package === selectedSubmission
  );
  const pending = filteredRelationships.filter((r) => isPending(r.status));
  const confirmed = filteredRelationships.filter((r) => r.status === "Confirmed");
  const rejected = filteredRelationships.filter((r) => r.status === "Rejected");
  const highConf = pending.filter((r) => parseFloat(r.confidence_score) >= 0.9);
  const allResolved = filteredRelationships.length > 0 && pending.length === 0;

  // ── Actions ──────────────────────────────────────────────────────────────────
  const mutate = async (relId: string, action: "confirm" | "reject") => {
    setActionLoading((p) => ({ ...p, [relId]: action }));
    setActionError(null);
    try {
      const updated =
        action === "confirm"
          ? await confirmRelationship(projectId, relId)
          : await rejectRelationship(projectId, relId);
      setRelationships((prev) =>
        prev.map((r) => (r.id === relId ? { ...r, status: updated.status } : r))
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Action failed. Please try again.";
      setActionError(msg);
    } finally {
      setActionLoading((p) => {
        const next = { ...p };
        delete next[relId];
        return next;
      });
    }
  };

  const bulkConfirm = async () => {
    for (const rel of highConf) {
      await mutate(rel.id, "confirm");
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setActionError(null);
    try {
      await generateRegister(projectId, selectedSubmission || undefined);
      onAllConfirmed?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Register generation failed.";
      setActionError(msg);
    } finally {
      setGenerating(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (fetchLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Loading relationships...</span>
        </div>
      </div>
    );
  }

  // ── Fetch error state ────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{fetchError}</span>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state (no relationships yet) ───────────────────────────────────────
  if (relationships.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="py-10 text-center text-slate-400">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-slate-500">No relationships found for this project.</p>
          <p className="text-sm mt-1">Upload a ZIP file and let AI extract the relationships.</p>
          <button
            onClick={fetchData}
            className="mt-4 flex items-center gap-2 mx-auto px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  const renderRow = (rel: RelationshipRecord) => {
    const score = parseFloat(rel.confidence_score);
    const isExpanded = expanded === rel.id;
    const drawingNum = getDrawingNumber(rel);
    const bbsNum = getBBSNumber(rel);

    return (
      <div
        key={rel.id}
        className={`border rounded-xl overflow-hidden transition-all ${
          rel.status === "Confirmed"
            ? "border-emerald-200 bg-emerald-50/40"
            : rel.status === "Rejected"
            ? "border-red-200 bg-red-50/40 opacity-60"
            : "border-slate-200 bg-white"
        }`}
      >
        {/* Row summary */}
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(isExpanded ? null : rel.id)}
            className="text-slate-400 hover:text-slate-700 shrink-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {/* Drawing */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-medium">Drawing</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{drawingNum}</p>
              <p className="text-xs text-slate-400">Rev: {getDrawingRevision(rel)}</p>
            </div>
          </div>

          <span className="text-slate-300 text-lg font-light shrink-0">↔</span>

          {/* BBS */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Package className="h-4 w-4 text-violet-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-medium">BBS</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{bbsNum}</p>
              <p className="text-xs text-slate-400">Rev: {getBBSRevision(rel)}</p>
            </div>
          </div>

          {/* Confidence */}
          <div className="shrink-0">
            <ConfidenceBar score={isNaN(score) ? 0 : score} />
          </div>

          {/* Status */}
          <div className="shrink-0">
            <StatusBadge status={rel.status} />
          </div>

          {/* Actions */}
          {isPending(rel.status) && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => mutate(rel.id, "confirm")}
                disabled={!!actionLoading[rel.id]}
                title="Confirm Relationship"
                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-50 transition-colors"
              >
                {actionLoading[rel.id] === "confirm" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => mutate(rel.id, "reject")}
                disabled={!!actionLoading[rel.id]}
                title="Reject Relationship"
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 disabled:opacity-50 transition-colors"
              >
                {actionLoading[rel.id] === "reject" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Expanded detail panel */}
        {isExpanded && (
          <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Drawing Details</p>
              <div className="space-y-1">
                <p>
                  <span className="text-slate-400">Number: </span>
                  <span className="font-semibold text-slate-700">{drawingNum}</span>
                </p>
                <p>
                  <span className="text-slate-400">Revision: </span>
                  <span className="font-semibold text-slate-700">{getDrawingRevision(rel)}</span>
                </p>
                <p>
                  <span className="text-slate-400">AI Confidence: </span>
                  <span className="font-semibold text-slate-700">
                    {isNaN(score) ? "—" : `${Math.round((score > 1 ? score / 100 : score) * 100)}%`}
                  </span>
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">BBS Details</p>
              <div className="space-y-1">
                <p>
                  <span className="text-slate-400">Number: </span>
                  <span className="font-semibold text-slate-700">{bbsNum}</span>
                </p>
                <p>
                  <span className="text-slate-400">Revision: </span>
                  <span className="font-semibold text-slate-700">{getBBSRevision(rel)}</span>
                </p>
                <p>
                  <span className="text-slate-400">Total Weight: </span>
                  <span className="font-semibold text-slate-700">{getTotalWeight(rel)}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Relationship Confirmation</h3>
          <p className="text-sm text-slate-500 mt-1">
            Review AI-proposed links between Drawing sheets and BBS files. Confirm or reject each match before
            generating the Register.
          </p>
        </div>

        {/* Summary counters */}
        <div className="flex gap-3 text-sm shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
            {pending.length} Pending
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
            {confirmed.length} Confirmed
          </div>
          {rejected.length > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold">
              {rejected.length} Rejected
            </div>
          )}
          <button
            onClick={() => { fetchData(); fetchSubmissions(); }}
            title="Refresh"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Submission Selector Dropdown */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Submission (ZIP Batch)</label>
        <select
          value={selectedSubmission}
          onChange={(e) => setSelectedSubmission(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm text-slate-800 font-medium transition-all shadow-sm outline-none cursor-pointer"
        >
          <option value="">-- All Submissions --</option>
          {submissions.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.submission_no} - {sub.original_filename} ({new Date(sub.created_at).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Bulk confirm toolbar */}
      {highConf.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
          <div className="flex items-center gap-2 text-blue-700">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-semibold">{highConf.length} relationships have ≥90% confidence</span>
          </div>
          <button
            onClick={bulkConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Bulk Confirm High Confidence
          </button>
        </div>
      )}

      {/* Relationship list */}
      <div className="space-y-3">
        {filteredRelationships.length > 0 ? (
          filteredRelationships.map(renderRow)
        ) : (
          <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No relationships found for the selected submission.
          </div>
        )}
      </div>

      {/* Generate Register CTA */}
      <div
        className={`border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          !allResolved ? "opacity-60" : ""
        }`}
      >
        <div>
          <p className="text-sm font-semibold text-slate-700">Ready to generate the Register?</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {allResolved
              ? "All relationships have been reviewed. Click to compile the Register."
              : `${pending.length} relationship(s) still pending. Resolve all before generating.`}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={!allResolved || generating}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {generating ? "Generating..." : "Generate Register"}
        </button>
      </div>
    </div>
  );
}
