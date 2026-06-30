"use client";

import { useState, useEffect } from "react";
import { getAuditLogs } from "@/lib/api/audit";
import { Dialog } from "@/components/layout/Dialog";
import { Search, Eye, Info, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
      };
      if (search) params.search = search;
      if (moduleFilter) params.module = moduleFilter;

      const data = await getAuditLogs(params);
      if (data && data.results) {
        setLogs(data.results);
        setTotalCount(data.count || 0);
      } else {
        setLogs([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Audit log load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, moduleFilter]);

  const handleOpenDetails = (log: any) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Audit Trail Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review secure system audit trail, session updates, settings changes, and approval workflows.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        <div>
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
          >
            <option value="">All Modules</option>
            <option value="Auth">Auth</option>
            <option value="Settings">Settings</option>
            <option value="Production">Production</option>
            <option value="Leaves">Leaves</option>
            <option value="Documents">Documents</option>
          </select>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search user, action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Search
          </button>
        </div>
      </form>

      {/* Grid Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border">
            <tr>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Timestamp</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">User Email</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Action</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Module</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">IP Address</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground animate-pulse">
                  Querying audit log index...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No system logs match the current query.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-foreground font-medium">{log.user_email || "System"}</td>
                  <td className="px-6 py-4 text-foreground font-semibold">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold border",
                      log.action === "Create" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      log.action === "Update" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                      log.action === "Delete" && "bg-red-500/10 text-red-400 border-red-500/20",
                      log.action === "Approval" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      log.action === "Rejection" && "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-foreground">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{log.ip_address || "—"}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleOpenDetails(log)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground transition-colors"
                      title="View Full Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 10 && (
        <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
          <span className="text-xs text-muted-foreground">
            Showing {logs.length} of {totalCount} records
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 border border-border rounded text-xs font-semibold hover:bg-slate-500/5 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page * 10 >= totalCount}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 border border-border rounded text-xs font-semibold hover:bg-slate-500/5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* DETAILS DIALOG */}
      <Dialog isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Audit Event Details" size="sm">
        {selectedLog && (
          <div className="space-y-4">
            <div className="flex gap-3 bg-blue-500/5 border border-blue-500/10 p-3 rounded-lg">
              <Info className="h-5 w-5 text-brand-400 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-brand-400">Event Action</h4>
                <p className="text-sm font-bold text-foreground mt-0.5">{selectedLog.action} on module {selectedLog.module}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm pt-2">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">User / Account</span>
                <div className="text-foreground font-medium mt-0.5">{selectedLog.user_email || "System"}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">IP Address</span>
                <div className="text-foreground font-medium mt-0.5">{selectedLog.ip_address || "Unknown"}</div>
              </div>
              <div className="col-span-2">
                <span className="text-xs font-semibold text-muted-foreground">Target Entity ID</span>
                <div className="text-foreground font-mono mt-0.5">{selectedLog.entity_id || "None"}</div>
              </div>

              {selectedLog.previous_value && (
                <div className="col-span-2">
                  <span className="text-xs font-semibold text-muted-foreground">Previous State</span>
                  <pre className="text-[10px] text-foreground bg-slate-500/5 border border-border p-3 rounded-lg mt-1 font-mono whitespace-pre-wrap overflow-auto max-h-36">
                    {JSON.stringify(selectedLog.previous_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_value && (
                <div className="col-span-2">
                  <span className="text-xs font-semibold text-muted-foreground">New State</span>
                  <pre className="text-[10px] text-foreground bg-slate-500/5 border border-border p-3 rounded-lg mt-1 font-mono whitespace-pre-wrap overflow-auto max-h-36">
                    {JSON.stringify(selectedLog.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-border mt-6">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
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
