"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Weight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { Register, RegisterRow } from "@/lib/api/register_ai";

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
  register,
  rows,
  onUploadNew,
}: {
  register: Register;
  rows: RegisterRow[];
  onUploadNew: () => void;
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showAllExceptions, setShowAllExceptions] = useState(false);

  const allExceptions = register.validation_report?.exceptions ?? [];
  const errors = allExceptions.filter(
    (e) => e.severity === "Error" || e.severity === "Critical"
  );
  const warnings = allExceptions.filter((e) => e.severity === "Warning");
  const validationStatus = register.validation_report?.status ?? "—";
  const visibleExceptions = showAllExceptions ? allExceptions : allExceptions.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Register Review{" "}
            <span className="text-slate-400 font-normal text-base">
              v{register.version_number}
            </span>
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Generated on{" "}
            {new Date(register.generated_at).toLocaleString()}. Review the
            compiled register rows and validation report below.
          </p>
        </div>
        <button
          onClick={onUploadNew}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Upload New Revision
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{rows.length}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Total Rows</p>
        </div>
        <div
          className={`border rounded-xl p-4 text-center ${
            errors.length > 0
              ? "bg-red-50 border-red-200"
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
          className={`border rounded-xl p-4 text-center ${
            warnings.length > 0
              ? "bg-amber-50 border-amber-200"
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

      {/* Register rows table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200">
          <FileSpreadsheet className="h-4 w-4 text-slate-500" />
          <p className="font-semibold text-slate-700 text-sm">Register Rows</p>
        </div>

        {rows.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No register rows found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Column headers */}
            <div className="grid grid-cols-12 gap-4 px-5 py-2.5 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <div className="col-span-1" />
              <div className="col-span-3">Drawing No</div>
              <div className="col-span-1">Rev</div>
              <div className="col-span-3">BBS Numbers</div>
              <div className="col-span-1">Rev</div>
              <div className="col-span-2">Total Weight</div>
              <div className="col-span-1">Issues</div>
            </div>

            {rows.map((row) => {
              const isExpanded = expandedRow === row.id;
              const hasIssues = (row.validation_exceptions?.length ?? 0) > 0;

              return (
                <div key={row.id}>
                  <div
                    className={`grid grid-cols-12 gap-4 px-5 py-4 items-center text-sm ${
                      hasIssues ? "bg-red-50/40" : "hover:bg-slate-50/60"
                    } transition-colors`}
                  >
                    {/* Expand toggle */}
                    <div className="col-span-1">
                      <button
                        onClick={() =>
                          setExpandedRow(isExpanded ? null : row.id)
                        }
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Drawing Number */}
                    <div className="col-span-3">
                      <span className="font-mono font-semibold text-slate-800 text-xs">
                        {row.drawing_number}
                      </span>
                    </div>

                    {/* Drawing Rev */}
                    <div className="col-span-1">
                      <span className="font-mono text-slate-600 text-xs">
                        {row.drawing_rev ?? "—"}
                      </span>
                    </div>

                    {/* BBS Numbers */}
                    <div className="col-span-3">
                      <span className="font-mono font-semibold text-slate-800 text-xs">
                        {row.bbs_numbers ?? "—"}
                      </span>
                    </div>

                    {/* BBS Rev */}
                    <div className="col-span-1">
                      <span className="font-mono text-slate-600 text-xs">
                        {row.bbs_revs ?? "—"}
                      </span>
                    </div>

                    {/* Total Weight */}
                    <div className="col-span-2 flex items-center gap-1">
                      <Weight className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700 text-xs">
                        {row.total_weight
                          ? `${parseFloat(row.total_weight).toLocaleString()} kg`
                          : "—"}
                      </span>
                    </div>

                    {/* Issues badge */}
                    <div className="col-span-1">
                      {hasIssues ? (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold">
                            {row.validation_exceptions.length}
                          </span>
                        </span>
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded exceptions */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
                      {row.remarks && (
                        <p className="text-xs text-slate-500 mb-2">
                          <span className="font-semibold">Remarks:</span>{" "}
                          {row.remarks}
                        </p>
                      )}
                      {hasIssues ? (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Row Validation Issues
                          </p>
                          {row.validation_exceptions.map((ex, i) => (
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
                          No issues for this row.
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
