"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, FileText, FileCheck, CreditCard, Plus, Download, AlertTriangle, Send, CheckCircle, XCircle } from "lucide-react";
import { 
  getProjectCommercialSummary, getPurchaseOrders, getInvoices, getPayments,
  submitInvoice, approveInvoice, sendInvoice, cancelInvoice, downloadInvoicePdf
} from "@/lib/api/commercial";
import { cn } from "@/lib/utils";
import UploadPOModal from "./UploadPOModal";
import CreateInvoiceModal from "./CreateInvoiceModal";
import RecordPaymentModal from "./RecordPaymentModal";

interface CommercialTabProps {
  project: any;
}

export default function CommercialTab({ project }: CommercialTabProps) {
  const [subTab, setSubTab] = useState<"overview" | "pos" | "invoices" | "payments" | "history">("overview");
  const [summary, setSummary] = useState<any>(null);
  const [pos, setPos] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isPOOpen, setIsPOOpen] = useState(false);
  const [isInvOpen, setIsInvOpen] = useState(false);
  const [paymentModalData, setPaymentModalData] = useState<{ id: string, no: string, outstanding: number } | null>(null);

  const loadData = async () => {
    try {
      const [sumData, poData, invData] = await Promise.all([
        getProjectCommercialSummary(project.id).catch(() => null),
        getPurchaseOrders(project.id).catch(() => []),
        getInvoices(project.id).catch(() => []),
      ]);
      setSummary(sumData);
      setPos(poData);
      setInvoices(invData);
    } catch (err) {
      console.error("Failed to load commercial data", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async (invoiceId: string) => {
    try {
      const data = await getPayments(invoiceId);
      setPayments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [project.id]);

  const handleInvoiceAction = async (id: string, action: "submit" | "approve" | "send" | "cancel") => {
    try {
      if (action === "submit") await submitInvoice(id);
      if (action === "approve") await approveInvoice(id);
      if (action === "send") await sendInvoice(id);
      if (action === "cancel") {
        const reason = prompt("Enter cancellation reason:");
        if (!reason) return;
        await cancelInvoice(id, reason);
      }
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Action failed.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 animate-pulse">Loading commercial data...</div>;
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: <DollarSign className="h-4 w-4" /> },
    { id: "pos", label: "Purchase Orders", icon: <FileText className="h-4 w-4" /> },
    { id: "invoices", label: "Invoices", icon: <FileCheck className="h-4 w-4" /> },
    { id: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Side Navigation for Sub-Tabs */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id as any)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left",
                subTab === item.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        {subTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase">Project Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{project.currency || "AED"} {project.project_value || 0}</p>
                {project.commercial_locked && (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="h-3 w-3" /> Locked
                  </span>
                )}
              </div>
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase">Total Invoiced</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{project.currency || "AED"} {summary?.total_invoiced || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase">Total Received</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{project.currency || "AED"} {summary?.total_received || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase">Outstanding</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{project.currency || "AED"} {summary?.total_outstanding || 0}</p>
              </div>
            </div>
          </div>
        )}

        {subTab === "pos" && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Purchase Orders</h3>
              <button 
                onClick={() => setIsPOOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" /> Upload PO
              </button>
            </div>
            {pos.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p>No Purchase Orders uploaded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs text-slate-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">PO Number</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Value</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pos.map((po) => (
                      <tr key={po.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{po.po_number}</td>
                        <td className="px-4 py-3 text-gray-600">{po.po_date}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">{project.currency} {po.po_value}</td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-1 rounded text-xs font-semibold", 
                            po.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600")}>
                            {po.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {subTab === "invoices" && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Invoices</h3>
              <button 
                onClick={() => setIsInvOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" /> Create Draft Invoice
              </button>
            </div>
            {invoices.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <FileCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p>No Invoices generated yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs text-slate-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Invoice No</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{inv.invoice_number}</td>
                        <td className="px-4 py-3 text-gray-600">{inv.invoice_date}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">{inv.currency} {inv.total_amount}</td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-1 rounded text-xs font-semibold", 
                            inv.status === "Approved" ? "bg-blue-50 text-blue-700" :
                            inv.status === "Draft" ? "bg-gray-100 text-gray-600" :
                            "bg-amber-50 text-amber-700"
                          )}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {inv.status !== "Draft" && (
                              <button 
                                onClick={() => downloadInvoicePdf(inv.id, inv.invoice_number)} 
                                className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                            {inv.status === "Draft" && (
                              <button onClick={() => handleInvoiceAction(inv.id, "submit")} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">Submit</button>
                            )}
                            {inv.status === "Under Review" && (
                              <button onClick={() => handleInvoiceAction(inv.id, "approve")} className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded">Approve</button>
                            )}
                            {inv.status === "Approved" && (
                              <button onClick={() => handleInvoiceAction(inv.id, "send")} className="text-xs font-bold text-purple-600 hover:bg-purple-50 px-2 py-1 rounded">Send</button>
                            )}
                            {inv.status === "Sent" && (
                              <button 
                                onClick={() => setPaymentModalData({ 
                                  id: inv.id, no: inv.invoice_number, 
                                  outstanding: parseFloat(inv.total_amount) - parseFloat(inv.total_paid || 0) 
                                })}
                                className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1 border border-emerald-200 rounded"
                              >
                                Record Payment
                              </button>
                            )}
                            {!["Cancelled", "Paid"].includes(inv.status) && (
                              <button onClick={() => handleInvoiceAction(inv.id, "cancel")} className="text-xs font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded">Cancel</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {subTab === "payments" && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Payments & History</h3>
            </div>
            
            <div className="p-4 bg-gray-50 flex items-center gap-4 border-b border-gray-100">
              <label className="text-sm font-semibold text-gray-700">Select Invoice:</label>
              <select 
                onChange={(e) => loadPayments(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 outline-none w-64"
              >
                <option value="">-- Choose an Invoice --</option>
                {invoices.filter(i => ["Sent", "Partially Paid", "Paid"].includes(i.status)).map(i => (
                  <option key={i.id} value={i.id}>{i.invoice_number}</option>
                ))}
              </select>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p>Select an active invoice to view payment history.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs text-slate-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3 text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{pay.payment_date}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{pay.payment_mode}</td>
                        <td className="px-4 py-3 text-gray-500">{pay.payment_reference || "-"}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">
                          {project.currency} {pay.amount_received}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {isPOOpen && (
        <UploadPOModal 
          projectId={project.id} 
          onClose={() => setIsPOOpen(false)} 
          onSuccess={() => { setIsPOOpen(false); loadData(); }} 
        />
      )}

      {isInvOpen && (
        <CreateInvoiceModal 
          projectId={project.id} 
          projectCurrency={project.currency || "AED"} 
          pos={pos} 
          onClose={() => setIsInvOpen(false)} 
          onSuccess={() => { setIsInvOpen(false); loadData(); }} 
        />
      )}

      {paymentModalData && (
        <RecordPaymentModal
          invoiceId={paymentModalData.id}
          invoiceNumber={paymentModalData.no}
          outstanding={paymentModalData.outstanding}
          currency={project.currency || "AED"}
          onClose={() => setPaymentModalData(null)}
          onSuccess={() => { setPaymentModalData(null); loadData(); }}
        />
      )}
    </div>
  );
}
