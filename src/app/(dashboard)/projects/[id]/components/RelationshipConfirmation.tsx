"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import {
  getRelationships,
  confirmRelationship,
  rejectRelationship,
  generateRegister,
  Relationship,
} from "@/lib/api/register_ai";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 90
      ? "bg-emerald-500"
      : pct >= 70
      ? "bg-amber-400"
      : pct >= 50
      ? "bg-orange-500"
      : "bg-red-500";
  const textColor =
    pct >= 90
      ? "text-emerald-700"
      : pct >= 70
      ? "text-amber-700"
      : pct >= 50
      ? "text-orange-700"
      : "text-red-700";
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
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums ${textColor}`}>{pct}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: Relationship["status"] }) {
  const map: Record<string, string> = {
    Proposed: "bg-blue-50 text-blue-700 border-blue-200",
    Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RelationshipConfirmation({
  projectId,
  relationships: initial,
  onAllConfirmed,
}: {
  projectId: string;
  relationships: Relationship[];
  onAllConfirmed: () => void;
}) {
  const [relationships, setRelationships] = useState<Relationship[]>(initial);
  const [loading, setLoading] = useState<Record<string, string>>({}); // relId -> "confirm"|"reject"
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const pending = relationships.filter((r) => r.status === "Proposed");
  const confirmed = relationships.filter((r) => r.status === "Confirmed");
  const rejected = relationships.filter((r) => r.status === "Rejected");
  const highConf = pending.filter((r) => parseFloat(r.confidence_score) >= 0.9);
  const allResolved = pending.length === 0;

  const mutate = async (
    relId: string,
    action: "confirm" | "reject"
  ) => {
    setLoading((p) => ({ ...p, [relId]: action }));
    setError(null);
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
      setError(msg);
    } finally {
      setLoading((p) => {
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
    setError(null);
    try {
      await generateRegister(projectId);
      onAllConfirmed();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Register generation failed.";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const renderRow = (rel: Relationship) => {
    const score = parseFloat(rel.confidence_score);
    const isExpanded = expanded === rel.id;
    const drawingNums = rel.drawing_files
      .map((d) => d.drawing_metadata.drawing_number ?? "—")
      .join(", ");
    const bbsNums = rel.bbs_files
      .map((b) => b.bbs_metadata.bbs_number ?? "—")
      .join(", ");

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
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Drawing */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-medium">Drawing</p>
              <p className="text-sm font-semibold text-slate-800 truncate">
                {drawingNums}
              </p>
              <p className="text-xs text-slate-400">
                Rev: {rel.drawing_files[0]?.drawing_metadata.revision ?? "—"}
              </p>
            </div>
          </div>

          {/* Arrow */}
          <span className="text-slate-300 text-lg font-light shrink-0">↔</span>

          {/* BBS */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Package className="h-4 w-4 text-violet-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-medium">BBS</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{bbsNums}</p>
              <p className="text-xs text-slate-400">
                Rev: {rel.bbs_files[0]?.bbs_metadata.revision ?? "—"}
              </p>
            </div>
          </div>

          {/* Confidence */}
          <div className="shrink-0">
            <ConfidenceBar score={score} />
          </div>

          {/* Status */}
          <div className="shrink-0">
            <StatusBadge status={rel.status} />
          </div>

          {/* Actions */}
          {rel.status === "Proposed" && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => mutate(rel.id, "confirm")}
                disabled={!!loading[rel.id]}
                title="Confirm Relationship"
                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-50 transition-colors"
              >
                {loading[rel.id] === "confirm" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => mutate(rel.id, "reject")}
                disabled={!!loading[rel.id]}
                title="Reject Relationship"
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 disabled:opacity-50 transition-colors"
              >
                {loading[rel.id] === "reject" ? (
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
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Drawing Details
              </p>
              {rel.drawing_files.map((d) => (
                <div key={d.id} className="space-y-1">
                  <p>
                    <span className="text-slate-400">Number: </span>
                    <span className="font-semibold text-slate-700">
                      {d.drawing_metadata.drawing_number ?? "—"}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-400">Title: </span>
                    <span className="text-slate-700">
                      {d.drawing_metadata.title ?? "—"}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-400">Revision: </span>
                    <span className="font-semibold text-slate-700">
                      {d.drawing_metadata.revision ?? "—"}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-400">AI Confidence: </span>
                    <span className="font-semibold text-slate-700">
                      {d.drawing_metadata.ai_confidence_score
                        ? `${Math.round(parseFloat(d.drawing_metadata.ai_confidence_score) * 100)}%`
                        : "—"}
                    </span>
                  </p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                BBS Details
              </p>
              {rel.bbs_files.map((b) => (
                <div key={b.id} className="space-y-1">
                  <p>
                    <span className="text-slate-400">Number: </span>
                    <span className="font-semibold text-slate-700">
                      {b.bbs_metadata.bbs_number ?? "—"}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-400">Revision: </span>
                    <span className="font-semibold text-slate-700">
                      {b.bbs_metadata.revision ?? "—"}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-400">Total Weight: </span>
                    <span className="font-semibold text-slate-700">
                      {b.bbs_metadata.weight
                        ? `${parseFloat(b.bbs_metadata.weight).toLocaleString()} kg`
                        : "—"}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-400">AI Confidence: </span>
                    <span className="font-semibold text-slate-700">
                      {b.bbs_metadata.ai_confidence_score
                        ? `${Math.round(parseFloat(b.bbs_metadata.ai_confidence_score) * 100)}%`
                        : "—"}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Relationship Confirmation</h3>
          <p className="text-sm text-slate-500 mt-1">
            Review AI-proposed links between Drawing sheets and BBS files. Confirm
            or reject each match before generating the Register.
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
        </div>
      </div>

      {/* Global error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Bulk confirm toolbar */}
      {highConf.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
          <div className="flex items-center gap-2 text-blue-700">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {highConf.length} relationships have ≥90% confidence
            </span>
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
        {relationships.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No relationships found for this project.</p>
          </div>
        ) : (
          relationships.map(renderRow)
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
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {generating ? "Generating..." : "Generate Register"}
        </button>
      </div>
    </div>
  );
}
