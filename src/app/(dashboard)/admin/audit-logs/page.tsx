"use client";

import { useState, useEffect } from "react";
import { mockService } from "@/lib/api/mockService";
import { AuditLog } from "@/types/admin";
import { Dialog } from "@/components/layout/Dialog";
import {
  FileSpreadsheet,
  Search,
  SlidersHorizontal,
  Eye,
  Info,
} from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLogs(mockService.getAuditLogs());
  };

  const handleOpenDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  const filteredLogs = logs.filter((log) => {
    const user = log.user.toLowerCase();
    const action = log.action.toLowerCase();
    const details = (log.details || "").toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = user.includes(query) || action.includes(query) || details.includes(query);
    const matchesModule = moduleFilter === "all" || log.module === moduleFilter;

    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review structural logging, session events, master record changes, and operational activities.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        <div>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
          >
            <option value="all">All Modules</option>
            <option value="Authentication">Authentication</option>
            <option value="Masters">Masters</option>
            <option value="Projects">Projects</option>
            <option value="Attendance">Attendance</option>
            <option value="Production">Production</option>
            <option value="Documents">Documents</option>
            <option value="Administration">Administration</option>
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search user, action, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border">
            <tr>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Timestamp</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">User</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Action</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Module</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Summary</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="h-8 w-8 text-white/30" />
                    <span>No system logs match the current query.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-foreground font-medium font-mono">{log.date}</div>
                    <div className="text-xs text-muted-foreground font-mono">{log.time}</div>
                  </td>
                  <td className="px-6 py-4 text-foreground font-medium">{log.user}</td>
                  <td className="px-6 py-4 text-foreground font-semibold">{log.action}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-foreground">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground max-w-xs truncate" title={log.details}>
                    {log.details || "—"}
                  </td>
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

      {/* DETAILS DIALOG */}
      <Dialog isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Audit Event Details" size="sm">
        {selectedLog && (
          <div className="space-y-4">
            <div className="flex gap-3 bg-blue-500/5 border border-blue-500/10 p-3 rounded-lg">
              <Info className="h-5 w-5 text-brand-400 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-brand-400">Event Action</h4>
                <p className="text-sm font-bold text-foreground mt-0.5">{selectedLog.action}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm pt-2">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">User / Account</span>
                <div className="text-foreground font-medium mt-0.5">{selectedLog.user}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">System Module</span>
                <div className="text-foreground font-medium mt-0.5">{selectedLog.module}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Date Logged</span>
                <div className="text-foreground font-mono mt-0.5">{selectedLog.date}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Time Logged</span>
                <div className="text-foreground font-mono mt-0.5">{selectedLog.time}</div>
              </div>
              <div className="col-span-2">
                <span className="text-xs font-semibold text-muted-foreground">Summary Log details</span>
                <div className="text-foreground bg-slate-500/5 border border-border p-3 rounded-lg mt-1 font-mono text-xs whitespace-pre-wrap">
                  {selectedLog.details || "No secondary information logged for this event."}
                </div>
              </div>
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
