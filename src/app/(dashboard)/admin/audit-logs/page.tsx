"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getAuditLogs } from "@/lib/api/audit";
import {
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  Filter,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  timestamp: string;
  user_name?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  description?: string;
  ip_address?: string;
  request_method?: string;
  api_endpoint?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(ts: string): string {
  try {
    return new Date(ts).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
  UPLOAD: "bg-violet-50 text-violet-700 border-violet-200",
  LOGIN: "bg-amber-50 text-amber-700 border-amber-200",
  LOGOUT: "bg-slate-50 text-slate-600 border-slate-200",
  CONFIRM: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECT: "bg-red-50 text-red-700 border-red-200",
};

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_COLORS[action.toUpperCase()] ?? "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wide ${cls}`}>
      {action}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ENTITY_TYPES = ["all", "Project", "Register", "Relationship", "Document", "User"];
const PAGE_SIZE = 20;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entityType, setEntityType] = useState("all");
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = useCallback(
    async (currentPage = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number> = { page: currentPage };
        if (entityType !== "all") params.entity_type = entityType;
        if (actionFilter.trim()) params.action = actionFilter.trim().toUpperCase();

        const data = await getAuditLogs(params);
        setLogs(data.results ?? data ?? []);
        if (data.count) setTotalPages(Math.ceil(data.count / PAGE_SIZE));
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Could not load audit logs.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [entityType, actionFilter]
  );

  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

  // Reset to page 1 when filters change
  const applyFilters = () => {
    setPage(1);
    fetchLogs(1);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <ClipboardList className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Audit Logs</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              View system-wide user actions and security events.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="h-3.5 w-3.5" />
            Filter:
          </div>

          {/* Entity type filter */}
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All Modules" : t}
              </option>
            ))}
          </select>

          {/* Action filter */}
          <input
            type="text"
            placeholder="Action (e.g. UPLOAD)"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 w-44"
          />

          <button
            onClick={applyFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Apply
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-2">User</div>
          <div className="col-span-1">Action</div>
          <div className="col-span-1">Module</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-2">IP / Endpoint</div>
        </div>

        {/* Table body */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No audit logs found.</p>
            <p className="text-sm mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-12 gap-3 px-5 py-3.5 text-sm hover:bg-slate-50/60 transition-colors"
              >
                <div className="col-span-2 text-xs text-slate-500 font-mono">
                  {formatDate(log.timestamp)}
                </div>
                <div className="col-span-2">
                  <p className="font-semibold text-slate-800 text-xs">{log.user_name ?? "—"}</p>
                  <p className="text-xs text-slate-400 truncate">{log.user_email ?? ""}</p>
                </div>
                <div className="col-span-1">
                  <ActionBadge action={log.action} />
                </div>
                <div className="col-span-1 text-xs text-slate-600 font-medium">
                  {log.entity_type}
                </div>
                <div className="col-span-4 text-xs text-slate-600 truncate" title={log.description ?? ""}>
                  {log.description ?? "—"}
                </div>
                <div className="col-span-2 text-xs">
                  <p className="text-slate-600 font-mono">{log.ip_address ?? "N/A"}</p>
                  <p className="text-slate-400 truncate">
                    {log.request_method} {log.api_endpoint}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-end items-center gap-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <span className="text-sm font-medium text-slate-600">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
