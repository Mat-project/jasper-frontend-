import React, { useState } from "react";
import { X, CreditCard } from "lucide-react";
import { recordPayment } from "@/lib/api/commercial";

interface RecordPaymentModalProps {
  invoiceId: string;
  invoiceNumber: string;
  outstanding: number;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecordPaymentModal({
  invoiceId,
  invoiceNumber,
  outstanding,
  currency,
  onClose,
  onSuccess,
}: RecordPaymentModalProps) {
  const [formData, setFormData] = useState({
    amount_received: outstanding.toString(),
    payment_date: new Date().toISOString().split("T")[0],
    payment_reference: "",
    payment_mode: "Bank Transfer",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount_received);
    if (amount <= 0 || amount > outstanding) {
      setError(`Amount must be between 0.01 and ${outstanding}`);
      return;
    }
    setLoading(true);
    setError("");

    try {
      await recordPayment({
        invoice: invoiceId,
        amount_received: amount,
        payment_date: formData.payment_date,
        payment_reference: formData.payment_reference,
        payment_mode: formData.payment_mode,
        notes: formData.notes,
      });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to record payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-600" /> Record Payment
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
            Recording payment for Invoice <strong>{invoiceNumber}</strong>. <br />
            Outstanding Amount: <strong>{currency} {outstanding.toFixed(2)}</strong>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Amount Received *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-slate-500 font-bold">{currency}</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={outstanding}
                required
                value={formData.amount_received}
                onChange={(e) => setFormData({ ...formData, amount_received: e.target.value })}
                className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payment Date *</label>
              <input
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payment Mode *</label>
              <select
                required
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none bg-white"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reference No.</label>
            <input
              type="text"
              placeholder="e.g., Transaction ID / Cheque No."
              value={formData.payment_reference}
              onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Payment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
