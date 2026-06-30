"use client";

import { useState, useEffect } from "react";
import { mockService } from "@/lib/api/mockService";
import { User } from "@/types/user";
import { Project } from "@/types/projects";
import { DrawingCategory } from "@/types/masters";
import { ClipboardSignature, AlertCircle, CheckCircle, Save, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductionEntryPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<DrawingCategory[]>([]);

  // Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    employee_id: "",
    project_id: "",
    drawing_category_id: "",
    quantity: 1,
    tonnage: 0.0,
    remarks: "",
  });

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const activeEmps = mockService.getEmployees().filter((e) => e.is_active);
    const activeProjs = mockService.getProjects().filter((p) => p.status === "Active" || p.status === "Planned");
    
    setEmployees(activeEmps);
    setProjects(activeProjs);
    setCategories(mockService.getDrawingCategories());

    // Defaults
    setForm((prev) => ({
      ...prev,
      employee_id: activeEmps[0]?.id || "",
      project_id: activeProjs[0]?.id || "",
      drawing_category_id: mockService.getDrawingCategories()[0]?.id || "",
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent, submit = false) => {
    e.preventDefault();
    setNotification(null);

    // Validation
    if (!form.date || !form.employee_id || !form.project_id || !form.drawing_category_id || form.quantity <= 0) {
      setNotification({
        type: "error",
        message: "Please fill in all required fields and ensure quantity is greater than 0.",
      });
      return;
    }

    try {
      mockService.createProductionEntry(form, submit);
      setNotification({
        type: "success",
        message: submit
          ? "Production entry submitted successfully for approval!"
          : "Production entry saved as draft.",
      });
      
      // Reset numeric fields
      setForm((prev) => ({
        ...prev,
        quantity: 1,
        tonnage: 0.0,
        remarks: "",
      }));
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to log production entry.",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Production Entry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Log daily quantities and tonnage outputs completed by drafting and engineering teams.
        </p>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={cn(
            "p-4 rounded-xl border text-sm flex items-start gap-2.5 animate-fade-in",
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          )}
        >
          {notification.type === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={(e) => handleSubmit(e, true)} className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <ClipboardSignature className="h-5 w-5 text-brand-400" />
          <h2 className="text-base font-bold text-foreground">Entry Details</h2>
        </div>

        {/* Date & Employee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Draftsman / Employee *</label>
            <select
              value={form.employee_id}
              onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              required
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Project & Drawing Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Project *</label>
            <select
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Drawing Category *</label>
            <select
              value={form.drawing_category_id}
              onChange={(e) => setForm({ ...form, drawing_category_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity & Tonnage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Quantity (Drawings) *</label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Tonnage (Metric Tons)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={form.tonnage}
              onChange={(e) => setForm({ ...form, tonnage: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Remarks</label>
          <textarea
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            placeholder="Add comments on sheet references or detailing difficulties..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-input hover:bg-slate-500/5 rounded-lg text-sm font-semibold text-foreground transition-all duration-150"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-sm shadow-md transition-all duration-150"
          >
            <Send className="h-4 w-4" />
            Submit Entry
          </button>
        </div>
      </form>
    </div>
  );
}
