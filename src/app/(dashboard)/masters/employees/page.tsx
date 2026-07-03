"use client";

import { useState, useEffect } from "react";
import { getEmployees, createEmployee, updateEmployee, toggleEmployeeStatus } from "@/lib/api/employees";
import apiClient from "@/lib/api/client";
import { getDepartments, getSections, getRoles } from "@/lib/api/masters";
import { Dialog } from "@/components/layout/Dialog";
import { User } from "@/types/user";
import { Department, Section, Role } from "@/types/masters";
import { Search, Plus, Eye, Edit2, Power, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type EmployeeRecord = User & { employee_code?: string; department?: string; section?: string };

const emptyForm = {
  employee_code: "", first_name: "", last_name: "", email: "",
  phone_number: "", department: "", section: "", team: "", role: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [emps, depts, secs, rls, tms] = await Promise.all([
        getEmployees(), 
        getDepartments(), 
        getSections(), 
        getRoles(),
        apiClient.get("/api/v1/masters/teams/").then(res => res.data)
      ]);
      setEmployees(emps as EmployeeRecord[]);
      setDepartments(depts);
      setSections(secs);
      setRoles(rls);
      setTeams(tms.results || tms);
    } catch (error) {
      console.error("Failed to load employee dependencies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleEmployeeStatus(id);
      loadData();
    } catch {
      alert("Failed to toggle employee status.");
    }
  };

  const handleOpenAdd = () => {
    setForm({ ...emptyForm, department: departments[0]?.name || "", section: sections[0]?.name || "", team: teams[0]?.name || "", role: roles[0]?.name || "" });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (emp: EmployeeRecord) => {
    setSelectedEmp(emp);
    setForm({
      employee_code: emp.employee_code || "",
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      phone_number: emp.phone_number || "",
      department: emp.department || departments[0]?.name || "",
      section: emp.section || sections[0]?.name || "",
      team: (emp as any).team || teams[0]?.name || "",
      role: emp.roles[0]?.name || roles[0]?.name || "",
    });
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_code || !form.first_name || !form.last_name || !form.email || !form.phone_number) {
      setFormError("All fields are required."); return;
    }
    setIsSaving(true); setFormError(null);
    try {
      await createEmployee(form);
      setIsAddOpen(false);
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string }; detail?: string } } };
      setFormError(e?.response?.data?.error?.message || e?.response?.data?.detail || "Failed to create employee.");
    } finally { setIsSaving(false); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    if (!form.employee_code || !form.first_name || !form.last_name || !form.email || !form.phone_number) {
      setFormError("All fields are required."); return;
    }
    setIsSaving(true); setFormError(null);
    try {
      await updateEmployee(selectedEmp.id, form);
      setIsEditOpen(false);
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setFormError(e?.response?.data?.error?.message || "Failed to update employee.");
    } finally { setIsSaving(false); }
  };

  const filteredEmployees = employees.filter((emp) => {
    const query = search.toLowerCase();
    const matchesSearch =
      (emp.employee_code || "").toLowerCase().includes(query) ||
      (emp.full_name || "").toLowerCase().includes(query) ||
      (emp.email || "").toLowerCase().includes(query);
    const matchesDept = selectedDept === "all" || emp.department === selectedDept;
    const matchesRole = selectedRole === "all" || emp.roles.some((r) => r.name === selectedRole);
    let matchesStatus = true;
    if (selectedStatus === "active") matchesStatus = emp.is_active;
    if (selectedStatus === "inactive") matchesStatus = !emp.is_active;
    return matchesSearch && matchesDept && matchesRole && matchesStatus;
  });

  const formFields = (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Employee Code *</label>
          <input type="text" value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} placeholder="EMP-100" className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" required />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Phone Number *</label>
          <input type="text" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="10 digit number" className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">First Name *</label>
          <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First name" className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" required />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Last Name *</label>
          <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last name" className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">Email Address *</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" required />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Department</label>
          <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-2 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none">
            <option value="">None</option>
            {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Section</label>
          <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="w-full px-2 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none">
            <option value="">None</option>
            {sections.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Team</label>
          <select value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} className="w-full px-2 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none">
            <option value="">None</option>
            {teams.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-2 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none">
            {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your organization&apos;s engineering staff, department tags, and access permissions.</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg shadow-lg hover:shadow-brand-500/20 transition-all duration-150 self-start sm:self-center">
          <Plus className="h-4 w-4" />Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="relative col-span-1 sm:col-span-2 lg:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by code, name, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none">
          <option value="all">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none">
          <option value="all">All Roles</option>
          {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
        </select>
        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border">
            <tr>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Code</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Name</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Email</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Phone</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Dept / Section</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Role</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground">Status</th>
              <th className="px-6 py-3.5 font-semibold text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">Loading...</td></tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-8 w-8 text-white/30" />
                    <span>No employees found matching the filters.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-foreground">{emp.employee_code || "—"}</td>
                  <td className="px-6 py-4 font-medium text-foreground">{emp.full_name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{emp.email}</td>
                  <td className="px-6 py-4 text-muted-foreground">{emp.phone_number || "—"}</td>
                  <td className="px-6 py-4">
                    <div className="text-foreground">{emp.department || "—"}</div>
                    <div className="text-xs text-muted-foreground">{emp.section || "—"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                      {emp.roles[0]?.name || "Viewer"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium", emp.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300")}>
                      {emp.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {emp.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setSelectedEmp(emp); setIsDetailsOpen(true); }} className="p-1.5 rounded-lg text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground transition-colors" title="View Details"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => handleOpenEdit(emp)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground transition-colors" title="Edit"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleToggleStatus(emp.id)} className={cn("p-1.5 rounded-lg transition-colors", emp.is_active ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20")} title={emp.is_active ? "Deactivate" : "Activate"}><Power className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Employee" size="md">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" /><span>{formError}</span></div>}
          {formFields}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 border border-input rounded-lg text-sm font-medium hover:bg-muted text-foreground transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium shadow-md transition-colors">{isSaving ? "Saving..." : "Save Employee"}</button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Employee" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" /><span>{formError}</span></div>}
          {formFields}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border border-input rounded-lg text-sm font-medium hover:bg-muted text-foreground transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium shadow-md transition-colors">{isSaving ? "Saving..." : "Update Employee"}</button>
          </div>
        </form>
      </Dialog>

      <Dialog isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Employee Details" size="sm">
        {selectedEmp && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-brand-500/10 text-brand-300 font-bold text-xl flex items-center justify-center border border-brand-500/20">
                {selectedEmp.first_name[0]}{selectedEmp.last_name[0]}
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">{selectedEmp.full_name}</h4>
                <span className="text-xs text-muted-foreground font-mono">{selectedEmp.employee_code || "—"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm border-t border-border pt-4">
              <div><div className="text-xs font-semibold text-muted-foreground">Email</div><div className="text-foreground font-medium mt-0.5">{selectedEmp.email}</div></div>
              <div><div className="text-xs font-semibold text-muted-foreground">Phone</div><div className="text-foreground font-medium mt-0.5">{selectedEmp.phone_number || "—"}</div></div>
              <div><div className="text-xs font-semibold text-muted-foreground">Department</div><div className="text-foreground font-medium mt-0.5">{selectedEmp.department || "—"}</div></div>
              <div><div className="text-xs font-semibold text-muted-foreground">Section</div><div className="text-foreground font-medium mt-0.5">{selectedEmp.section || "—"}</div></div>
              <div><div className="text-xs font-semibold text-muted-foreground">Role</div><div className="text-foreground font-medium mt-0.5">{selectedEmp.roles[0]?.name || "Viewer"}</div></div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground">Status</div>
                <div className="mt-1">
                  <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", selectedEmp.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300")}>
                    {selectedEmp.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="col-span-2"><div className="text-xs font-semibold text-muted-foreground">Date Joined</div><div className="text-foreground font-medium mt-0.5">{new Date(selectedEmp.date_joined).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div></div>
            </div>
            <div className="flex justify-end pt-4 border-t border-border">
              <button type="button" onClick={() => setIsDetailsOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground rounded-lg text-sm font-medium transition-colors">Close</button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
