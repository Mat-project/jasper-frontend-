"use client";

import React, { useState, useCallback } from "react";
import {
  Coins,
  ChevronRight,
  Search,
  Landmark,
  ShieldCheck,
  Clock,
  Printer,
  Eye,
} from "lucide-react";
import {
  EnterpriseSalaryStructure,
  EnterprisePayslip,
  getPayslips,
  getSalaryStructures,
  generatePayslips,
  createSalaryStructure,
  updateSalaryStructure,
} from "@/lib/api/payroll";
import { getEmployees } from "@/lib/api/employees";
import { cn } from "@/lib/utils";

export default function EnterprisePayrollPage() {
  const [payslips, setPayslips] = useState<EnterprisePayslip[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<EnterpriseSalaryStructure[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generatePeriod, setGeneratePeriod] = useState("July 2026");
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<EnterpriseSalaryStructure | null>(null);
  const [compensationClassification, setCompensationClassification] = useState("Production Specialist (Submission-Based)");

  const loadData = useCallback(async () => {
    try {
      const [payslipData, structData, empData] = await Promise.all([
        getPayslips(),
        getSalaryStructures(),
        getEmployees(),
      ]);
      setPayslips(payslipData);
      setSalaryStructures(structData);
      const mappedEmps = empData.map((emp: any) => ({
        id: emp.id,
        code: emp.employee_code || emp.id.substring(0, 8),
        first_name: emp.first_name || "",
        last_name: emp.last_name || "",
        email: emp.email,
        phone: emp.phone_number || "",
        avatar: emp.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        designation: emp.role || "Engineer",
        department: emp.department || "Engineering",
        join_date: emp.date_joined ? emp.date_joined.split("T")[0] : "2026-01-01",
      }));
      setEmployees(mappedEmps);
    } catch (err) {
      console.error("Failed to load payroll data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    const handleAction = () => {
      loadData();
    };
    window.addEventListener('production-action-occurred', handleAction);
    return () => window.removeEventListener('production-action-occurred', handleAction);
  }, [loadData]);

  const handleGeneratePayslips = async () => {
    try {
      const generated = await generatePayslips(generatePeriod);
      // We re-fetch payslips to merge properly
      const newPayslips = await getPayslips();
      setPayslips(newPayslips);
      setIsGenerateModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveStructure = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      employee_id: formData.get("employee_id"),
      basic_salary: Number(formData.get("basic_salary")),
      compensation_classification: compensationClassification,
      drawing_submission_rate: compensationClassification === "Production Specialist (Submission-Based)" ? Number(formData.get("drawing_submission_rate")) : 0,
      drawing_checking_rate: compensationClassification === "Technical Reviewer (Verification-Based)" ? Number(formData.get("drawing_checking_rate")) : 0,
      hra: 0,
      special_allowance: 0,
      conveyance_allowance: 0,
      pf_deduction: 0,
      esi_deduction: 0,
      tds_tax_deduction: 0,
      overtime_hourly_rate: 0,
    };

    try {
      if (editingStructure) {
        await updateSalaryStructure(editingStructure.id, data);
      } else {
        await createSalaryStructure(data);
      }
      const newStructs = await getSalaryStructures();
      setSalaryStructures(newStructs);
      setIsStructureModalOpen(false);
      setEditingStructure(null);
    } catch (err) {
      console.error("Failed to save structure", err);
    }
  };

  const [activeTab, setActiveTab] = useState<"payslips" | "structures" | "preview">("payslips");
  const [search, setSearch] = useState("");
  const [selectedPayslip, setSelectedPayslip] = useState<EnterprisePayslip | null>(null);

  const totalGross = Math.round(payslips.reduce((sum, p) => sum + p.gross_earnings, 0) * 100) / 100;
  const totalNet = Math.round(payslips.reduce((sum, p) => sum + p.net_salary, 0) * 100) / 100;
  const totalDeductions = Math.round(payslips.reduce((sum, p) => sum + p.gross_deductions, 0) * 100) / 100;
  const totalOT = Math.round(payslips.reduce((sum, p) => sum + (p.overtime_pay || 0), 0) * 100) / 100;
  const totalBaseSalary = Math.round(salaryStructures.reduce((sum, ss) => sum + ss.basic_salary, 0) * 100) / 100;

  const filteredPayslips = payslips.filter((p) => {
    const emp = employees.find((e) => e.id === p.employee_id);
    const name = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : "";
    return name.includes(search.toLowerCase()) || p.employee_id.toLowerCase().includes(search.toLowerCase());
  });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const handleViewPayslip = (payslip: EnterprisePayslip) => {
    setSelectedPayslip(payslip);
    setActiveTab("preview");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <span>Enterprise HRMS</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600 font-semibold">Payroll & Compensation</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <span className="p-1.5 bg-blue-50 rounded-lg"><Coins className="h-5 w-5 text-blue-600" /></span>
            Payroll Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage compensation, generate payslips, and track drawing-piece incentives.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Generate Payslips
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "GROSS PAYROLL", value: formatCurrency(totalGross), sub: "Base salaries + incentives", icon: <Coins className="h-5 w-5 text-blue-600" />, iconBg: "bg-blue-50" },
          { label: "NET DISBURSEMENT", value: formatCurrency(totalNet), sub: "Final payout after deductions", icon: <Landmark className="h-5 w-5 text-emerald-600" />, iconBg: "bg-emerald-50" },
          { label: "TOTAL BASE SALARY", value: formatCurrency(totalBaseSalary), sub: "Fixed monthly payroll", icon: <ShieldCheck className="h-5 w-5 text-amber-500" />, iconBg: "bg-amber-50" },
          { label: "DRAWING INCENTIVES", value: formatCurrency(totalOT), sub: "Approved piecewise outputs", icon: <Clock className="h-5 w-5 text-purple-600" />, iconBg: "bg-purple-50" },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
            </div>
            <div className={`p-3 ${card.iconBg} rounded-xl`}>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex gap-1 p-1.5 border-b border-gray-100">
          {[
            { key: "payslips", label: "Payslip Register" },
            { key: "structures", label: "Salary Structures" },
            { key: "preview", label: "Payslip Preview", disabled: !selectedPayslip },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key as typeof activeTab)}
              disabled={tab.disabled}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : tab.disabled
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-500 hover:text-slate-800 hover:bg-gray-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* PAYSLIP REGISTER TAB */}
        {activeTab === "payslips" && (
          <div className="p-4 space-y-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-slate-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Pay Period</th>
                    <th className="px-4 py-3 text-right">Gross Earnings</th>
                    <th className="px-4 py-3 text-right">Deductions</th>
                    <th className="px-4 py-3 text-right">Net Salary</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredPayslips.map((slip) => {
                    const emp = employees.find((e) => e.id === slip.employee_id);
                    if (!emp) return null;
                    return (
                      <tr key={slip.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img src={emp.avatar} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-100" />
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{emp.first_name} {emp.last_name}</p>
                              <p className="text-xs text-slate-400">{emp.designation}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-700">{slip.period}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-800">{formatCurrency(slip.gross_earnings)}</td>
                        <td className="px-4 py-3.5 text-right text-red-600 font-semibold">{formatCurrency(slip.gross_deductions)}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-700">{formatCurrency(slip.net_salary)}</td>
                        <td className="px-4 py-3.5">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                            slip.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            slip.status === "Processing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          )}>
                            {slip.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleViewPayslip(slip)}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View Payslip
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SALARY STRUCTURES TAB */}
        {activeTab === "structures" && (
          <div className="p-4 space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingStructure(null);
                  setCompensationClassification("Production Specialist (Submission-Based)");
                  setIsStructureModalOpen(true);
                }}
                className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                + Add Structure
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {salaryStructures.map((ss) => {
                const emp = employees.find((e) => e.id === ss.employee_id);
              if (!emp) return null;
              return (
                <div key={ss.employee_id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar} alt="" className="h-10 w-10 rounded-full ring-2 ring-gray-100 object-cover" />
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs text-slate-500">{emp.designation} · {emp.department} · {ss.compensation_classification || "Production Specialist (Submission-Based)"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Monthly Base</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(ss.basic_salary)}</p>
                    </div>
                  </div>
                  {/* Body */}
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-4">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Base Salary</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(ss.basic_salary)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Submission Rate</p>
                        <p className="text-sm font-bold text-blue-600 mt-0.5">{formatCurrency(ss.drawing_submission_rate ?? 250)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Checking Rate</p>
                        <p className="text-sm font-bold text-purple-600 mt-0.5">{formatCurrency(ss.drawing_checking_rate ?? 350)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs text-slate-500">
                      <div>
                        <span>PF: </span>
                        <span className="font-semibold text-gray-700">{formatCurrency(ss.pf_deduction || 0)}</span>
                      </div>
                      <div>
                        <span>ESI: </span>
                        <span className="font-semibold text-gray-700">{formatCurrency(ss.esi_deduction || 0)}</span>
                      </div>
                      <div>
                        <span>TDS: </span>
                        <span className="font-semibold text-gray-700">{formatCurrency(ss.tds_tax_deduction || 0)}</span>
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => {
                        setEditingStructure(ss);
                        setCompensationClassification(ss.compensation_classification || "Production Specialist (Submission-Based)");
                        setIsStructureModalOpen(true);
                      }}
                      className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Edit Structure
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}

        {/* PAYSLIP PREVIEW TAB */}
        {activeTab === "preview" && selectedPayslip && (() => {
          const emp = employees.find((e) => e.id === selectedPayslip.employee_id);
          const ss = salaryStructures.find((s) => s.employee_id === selectedPayslip.employee_id);
          if (!emp || !ss) return null;
          return (
            <div className="p-6">
              <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden print:shadow-none">
                {/* Company Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold">Jasper Engineering Solutions Pvt. Ltd.</h2>
                      <p className="text-blue-100 text-sm mt-0.5">CIN: U74999MH2020PTC345678</p>
                      <p className="text-blue-200 text-xs mt-1">Bandra Kurla Complex, Mumbai 400051, Maharashtra</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold bg-white/20 rounded-lg px-3 py-1">PAYSLIP</p>
                      <p className="text-sm text-blue-100 mt-1">{selectedPayslip.period}</p>
                    </div>
                  </div>
                </div>

                {/* Employee Info */}
                <div className="grid grid-cols-2 gap-6 px-8 py-5 bg-gray-50 border-b border-gray-200">
                  <div className="space-y-2">
                    {[
                      { label: "Employee Name", value: `${emp.first_name} ${emp.last_name}` },
                      { label: "Designation", value: emp.designation },
                      { label: "Department", value: emp.department },
                      { label: "Employee Code", value: emp.code },
                    ].map((item) => (
                      <div key={item.label} className="flex gap-3 text-sm">
                        <span className="text-slate-500 w-32">{item.label}</span>
                        <span className="font-semibold text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Date of Joining", value: emp.join_date },
                      { label: "Pay Period", value: selectedPayslip.period },
                      { label: "Paid Date", value: selectedPayslip.paid_date },
                      { label: "Status", value: selectedPayslip.status },
                    ].map((item) => (
                      <div key={item.label} className="flex gap-3 text-sm">
                        <span className="text-slate-500 w-28">{item.label}</span>
                        <span className="font-semibold text-gray-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Earnings & Deductions */}
                <div className="grid grid-cols-2 gap-0 divide-x divide-gray-200 px-0">
                  <div className="px-8 py-5 space-y-2.5">
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 pb-1.5 border-b border-emerald-100">
                      Earnings
                    </h4>
                    {[
                      { label: "Base Salary", value: ss.basic_salary },
                      ...(selectedPayslip.overtime_pay ? [{ label: "Drawing Incentives", value: selectedPayslip.overtime_pay }] : []),
                      ...(selectedPayslip.bonus ? [{ label: "Bonus", value: selectedPayslip.bonus }] : []),
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2.5 border-t border-emerald-100 font-bold text-emerald-700">
                      <span>Gross Earnings</span>
                      <span>{formatCurrency(selectedPayslip.gross_earnings)}</span>
                    </div>
                  </div>

                  <div className="px-8 py-5 space-y-2.5">
                    <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 pb-1.5 border-b border-red-100">
                      Deductions
                    </h4>
                    {[
                      ...(ss.pf_deduction ? [{ label: "PF (Employee)", value: ss.pf_deduction }] : []),
                      ...(ss.esi_deduction ? [{ label: "ESI", value: ss.esi_deduction }] : []),
                      ...(ss.tds_tax_deduction ? [{ label: "TDS", value: ss.tds_tax_deduction }] : []),
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-semibold text-red-600">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2.5 border-t border-red-100 font-bold text-red-700">
                      <span>Total Deductions</span>
                      <span>{formatCurrency(selectedPayslip.gross_deductions)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Pay */}
                <div className="mx-8 my-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl flex justify-between items-center">
                  <span className="text-base font-bold text-blue-800">Net Pay (Take Home)</span>
                  <span className="text-2xl font-extrabold text-blue-800">{formatCurrency(selectedPayslip.net_salary)}</span>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-gray-100 flex justify-between items-center text-xs text-slate-400">
                  <span>This is a system-generated payslip. No signature required.</span>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 print:hidden transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print Payslip
                  </button>
                </div>
              </div>

              <div className="flex justify-center mt-4 print:hidden">
                <button
                  onClick={() => { setSelectedPayslip(null); setActiveTab("payslips"); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  ← Back to Payslip Register
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* GENERATE PAYSLIPS MODAL */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Generate Payslips</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Pay Period (e.g. July 2026)</label>
                <input
                  type="text"
                  value={generatePeriod}
                  onChange={(e) => setGeneratePeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGeneratePayslips}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SALARY STRUCTURE MODAL */}
      {isStructureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {editingStructure ? "Edit Salary Structure" : "Add Salary Structure"}
              </h3>
            </div>
            <form onSubmit={handleSaveStructure}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Employee</label>
                  <select
                    name="employee_id"
                    defaultValue={editingStructure?.employee_id || ""}
                    disabled={!!editingStructure}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="" disabled>Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-4 font-sans">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Base Monthly Salary (AED)</label>
                    <input type="number" name="basic_salary" defaultValue={editingStructure?.basic_salary || 0} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Compensation Classification</label>
                    <select
                      name="compensation_classification"
                      value={compensationClassification}
                      onChange={(e) => setCompensationClassification(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Production Specialist (Submission-Based)">Production Specialist (Submission-Based)</option>
                      <option value="Technical Reviewer (Verification-Based)">Technical Reviewer (Verification-Based)</option>
                    </select>
                  </div>
                  {compensationClassification === "Production Specialist (Submission-Based)" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Submission Rate (AED)</label>
                      <input type="number" name="drawing_submission_rate" defaultValue={editingStructure?.drawing_submission_rate ?? 250} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  )}
                  {compensationClassification === "Technical Reviewer (Verification-Based)" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Checking Rate (AED)</label>
                      <input type="number" name="drawing_checking_rate" defaultValue={editingStructure?.drawing_checking_rate ?? 350} required className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  )}
                </div>
              </div>
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStructureModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Save Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
