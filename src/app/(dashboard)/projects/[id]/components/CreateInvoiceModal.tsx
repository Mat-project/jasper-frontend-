import React, { useState, useMemo } from "react";
import { X, FileCheck, Plus, Trash2 } from "lucide-react";
import { createDraftInvoice } from "@/lib/api/commercial";

interface CreateInvoiceModalProps {
  projectId: string;
  projectCurrency: string;
  pos: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateInvoiceModal({ projectId, projectCurrency, pos, onClose, onSuccess }: CreateInvoiceModalProps) {
  const [formData, setFormData] = useState({
    purchase_order: "",
    billing_period_start: "",
    billing_period_end: "",
    discount: "0",
    notes: "",
  });

  const [lineItems, setLineItems] = useState([
    { description: "", quantity: 1, unit_rate: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_rate), 0);
  }, [lineItems]);

  const totalAmount = useMemo(() => {
    const discount = parseFloat(formData.discount) || 0;
    return Math.max(0, subtotal - discount);
  }, [subtotal, formData.discount]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unit_rate: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.purchase_order) {
      setError("Please select a Purchase Order.");
      return;
    }
    if (lineItems.length === 0 || lineItems.some(item => !item.description || item.unit_rate <= 0)) {
      setError("Please add valid line items (Description and Rate required).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        project: projectId,
        purchase_order: formData.purchase_order,
        billing_period_start: formData.billing_period_start,
        billing_period_end: formData.billing_period_end,
        discount: formData.discount,
        notes: formData.notes,
        line_items: lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_rate: item.unit_rate
        })),
      };

      await createDraftInvoice(payload);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-600" /> Create Draft Invoice
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Purchase Order *</label>
                <select
                  required
                  value={formData.purchase_order}
                  onChange={(e) => setFormData({ ...formData, purchase_order: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none bg-white"
                >
                  <option value="">Select PO...</option>
                  {pos.filter(po => po.status === "Active").map(po => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} ({projectCurrency} {po.po_value})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Billing Period Start *</label>
                <input
                  type="date"
                  required
                  value={formData.billing_period_start}
                  onChange={(e) => setFormData({ ...formData, billing_period_start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Billing Period End *</label>
                <input
                  type="date"
                  required
                  value={formData.billing_period_end}
                  onChange={(e) => setFormData({ ...formData, billing_period_end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900 text-sm">Line Items</h4>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </button>
              </div>
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Description"
                        required
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        required
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Unit Rate"
                        required
                        value={item.unit_rate}
                        onChange={(e) => handleLineItemChange(index, "unit_rate", parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <div className="w-32 flex items-center justify-end px-3 py-1.5 bg-gray-50 rounded text-sm font-bold text-gray-700">
                      {(item.quantity * item.unit_rate).toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded mt-0.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-slate-500 font-medium px-2">
                  <span>Subtotal</span>
                  <span>{projectCurrency} {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-slate-500 font-medium">Discount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div className="flex justify-between items-center font-bold text-lg text-gray-900 border-t border-gray-200 pt-2 px-2">
                  <span>Total</span>
                  <span>{projectCurrency} {totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
                placeholder="Optional billing notes..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Save as Draft"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
