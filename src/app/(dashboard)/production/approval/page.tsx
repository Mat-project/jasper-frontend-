"use client";

import { useState, useEffect } from "react";
import { getProductionEntries, approveProductionEntry, rejectProductionEntry } from "@/lib/api/production";
import type { ProductionEntry } from "@/lib/api/production";
import { Dialog } from "@/components/layout/Dialog";
import {
  FileCheck2,
  Check,
  X,
  Eye,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductionApprovalPage() {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [activeTab, setActiveTab] = useState<ProductionEntry["status"]>("Submitted");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ProductionEntry | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getProductionEntries();
      setEntries(data);
    } catch (err) {
      console.error("Failed to load production entries", err);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const updated = await approveProductionEntry(id);
      loadData();
      window.dispatchEvent(new CustomEvent('production-action-occurred'));
      if (isDetailsOpen && selectedEntry?.id === id) {
        setSelectedEntry(updated);
      }
    } catch (err) {
      console.error("Failed to approve entry", err);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter reason for rejection:") || "";
    if (!reason) return;
    try {
      const updated = await rejectProductionEntry(id, reason);
      loadData();
      window.dispatchEvent(new CustomEvent('production-action-occurred'));
      if (isDetailsOpen && selectedEntry?.id === id) {
        setSelectedEntry(updated);
      }
    } catch (err) {
      console.error("Failed to reject entry", err);
    }
  };

  const handleOpenDetails = (entry: ProductionEntry) => {
    setSelectedEntry(entry);
    setIsDetailsOpen(true);
  };

  const filteredEntries = entries.filter((e) => e.status === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Production Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review, approve, or reject logged drawing metrics submitted by operators.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-500/5 border border-border rounded-xl w-fit">
        {(["Draft", "Submitted", "Approved", "Rejected"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150",
              activeTab === tab
                ? "bg-slate-800 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-slate-900 text-white/50">
              {entries.filter((e) => e.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border">
            <tr>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Date</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Draftsman</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Project</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Drawing Category</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Qty / Tonnage</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileCheck2 className="h-8 w-8 text-white/30" />
                    <span>No logs in the &quot;{activeTab}&quot; queue.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEntries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-foreground">{e.date}</td>
                  <td className="px-6 py-4 text-foreground font-medium">{e.employee_name}</td>
                  <td className="px-6 py-4 text-foreground font-semibold">{e.project_code} - {e.project_name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{e.drawing_category_name}</td>
                  <td className="px-6 py-4">
                    <div className="text-foreground font-semibold">{e.quantity} Sheets</div>
                    <div className="text-xs text-muted-foreground">{e.tonnage ? `${e.tonnage} Tons` : "0.0 Tons"}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenDetails(e)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {activeTab === "Submitted" && (
                        <>
                          <button
                            onClick={() => handleApprove(e.id)}
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(e.id)}
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
 
      {/* DETAILS DIALOG */}
      <Dialog isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Production Log Details" size="sm">
        {selectedEntry && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Log Date</span>
                <div className="font-mono mt-0.5 text-foreground">{selectedEntry.date}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Status</span>
                <div className="mt-1">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                      selectedEntry.status === "Approved" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      selectedEntry.status === "Rejected" && "bg-red-500/10 text-red-400 border-red-500/20",
                      selectedEntry.status === "Submitted" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                      selectedEntry.status === "Draft" && "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    )}
                  >
                    {selectedEntry.status}
                  </span>
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-xs font-semibold text-muted-foreground">Project</span>
                <div className="font-semibold mt-0.5 text-foreground">{selectedEntry.project_code} - {selectedEntry.project_name}</div>
              </div>
              <div className="col-span-2">
                <span className="text-xs font-semibold text-muted-foreground">Draftsman</span>
                <div className="font-semibold mt-0.5 text-foreground">{selectedEntry.employee_name}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Quantity</span>
                <div className="font-semibold mt-0.5 text-foreground">{selectedEntry.quantity} Sheets</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Tonnage</span>
                <div className="font-semibold mt-0.5 text-foreground">{selectedEntry.tonnage} Tons</div>
              </div>
              <div className="col-span-2">
                <span className="text-xs font-semibold text-muted-foreground">Drawing Category</span>
                <div className="font-medium mt-0.5 text-foreground">
                  {selectedEntry.drawing_category_name}
                </div>
              </div>
              {selectedEntry.remarks && (
                <div className="col-span-2">
                  <span className="text-xs font-semibold text-muted-foreground">Remarks</span>
                  <div className="text-foreground bg-slate-500/5 border border-border p-2.5 rounded-lg mt-1 whitespace-pre-line">
                    {selectedEntry.remarks}
                  </div>
                </div>
              )}
              {selectedEntry.status === "Rejected" && selectedEntry.rejection_reason && (
                <div className="col-span-2 bg-red-500/5 border border-red-500/10 p-3 rounded-lg flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-red-400">Rejection Reason</span>
                    <p className="text-xs text-red-200 mt-0.5">{selectedEntry.rejection_reason}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              {selectedEntry.status === "Submitted" && (
                <>
                  <button
                    onClick={() => handleReject(selectedEntry.id)}
                    className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/10 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedEntry.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
                  >
                    Approve
                  </button>
                </>
              )}
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
