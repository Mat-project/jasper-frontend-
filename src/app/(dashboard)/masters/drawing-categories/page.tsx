"use client";

import { useState, useEffect } from "react";
import { getDrawingCategories, createDrawingCategory, updateDrawingCategory, deleteDrawingCategory } from "@/lib/api/masters";
import { Dialog } from "@/components/layout/Dialog";
import { DrawingCategory } from "@/types/masters";
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react";

export default function DrawingCategoriesPage() {
  const [categories, setCategories] = useState<DrawingCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<DrawingCategory | null>(null);
  const [form, setForm] = useState({ code: "", name: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      setCategories(await getDrawingCategories());
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => { setForm({ code: "", name: "" }); setFormError(null); setIsAddOpen(true); };

  const handleOpenEdit = (cat: DrawingCategory) => {
    setSelectedCat(cat);
    setForm({ code: cat.code, name: cat.name });
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) { setFormError("All fields are required."); return; }
    setIsSaving(true); setFormError(null);
    try {
      await createDrawingCategory(form.code, form.name);
      setIsAddOpen(false);
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setFormError(e?.response?.data?.error?.message || "Failed to create drawing category.");
    } finally { setIsSaving(false); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCat || !form.code || !form.name) { setFormError("All fields are required."); return; }
    setIsSaving(true); setFormError(null);
    try {
      await updateDrawingCategory(selectedCat.id, form.code, form.name);
      setIsEditOpen(false);
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setFormError(e?.response?.data?.error?.message || "Failed to update drawing category.");
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this drawing category?")) return;
    try {
      await deleteDrawingCategory(id);
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      alert(e?.response?.data?.error?.message || "Failed to delete drawing category.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Drawing Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage drawing types used in production entries.</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg shadow-lg hover:shadow-brand-500/20 transition-all duration-150">
          <Plus className="h-4 w-4" />Add Category
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border">
            <tr>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Code</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Category Name</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">Loading...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">No drawing categories created yet.</td></tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-foreground">{cat.code}</td>
                  <td className="px-6 py-4 font-medium text-foreground">{cat.name}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenEdit(cat)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground transition-colors"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Drawing Category" size="sm">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4" /><span>{formError}</span></div>}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Category Code *</label>
            <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. STR" className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Category Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Structural" className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" required />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 border border-input rounded-lg text-sm font-medium hover:bg-muted text-foreground transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">{isSaving ? "Saving..." : "Save Category"}</button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Drawing Category" size="sm">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4" /><span>{formError}</span></div>}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Category Code *</label>
            <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Category Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" required />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border border-input rounded-lg text-sm font-medium hover:bg-muted text-foreground transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">{isSaving ? "Saving..." : "Update Category"}</button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
