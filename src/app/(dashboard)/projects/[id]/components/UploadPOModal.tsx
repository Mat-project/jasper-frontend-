import React, { useState } from "react";
import { X, Upload, File } from "lucide-react";
import { createPurchaseOrder } from "@/lib/api/commercial";

interface UploadPOModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadPOModal({ projectId, onClose, onSuccess }: UploadPOModalProps) {
  const [formData, setFormData] = useState({
    po_number: "",
    po_date: "",
    client_reference: "",
    po_value: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload a PO file.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const data = new FormData();
      data.append("project", projectId);
      data.append("po_number", formData.po_number);
      data.append("po_date", formData.po_date);
      data.append("client_reference", formData.client_reference);
      data.append("po_value", formData.po_value);
      data.append("po_file", file);

      await createPurchaseOrder(data);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to upload Purchase Order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" /> Upload Purchase Order
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">PO Number *</label>
              <input
                type="text"
                required
                value={formData.po_number}
                onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">PO Date *</label>
              <input
                type="date"
                required
                value={formData.po_date}
                onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Client Reference</label>
              <input
                type="text"
                value={formData.client_reference}
                onChange={(e) => setFormData({ ...formData, client_reference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">PO Value *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.po_value}
                onChange={(e) => setFormData({ ...formData, po_value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">PO Document (PDF) *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".pdf"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <File className="h-8 w-8 text-blue-500" />
                  <span className="text-sm font-semibold text-gray-700">{file.name}</span>
                  <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <Upload className="h-8 w-8 text-slate-400" />
                  <span className="text-sm font-medium">Click or drag PDF to upload</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100">
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
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload PO"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
