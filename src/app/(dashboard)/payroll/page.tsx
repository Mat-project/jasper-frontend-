"use client";

import React, { useState } from "react";
import {
  DollarSign,
  CreditCard,
  Building2,
  FileText,
  TrendingUp,
  Download,
  Printer,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  PieChart,
  ShieldCheck,
  Award,
  X,
  Eye,
} from "lucide-react";
import {
  ENTERPRISE_EMPLOYEES,
  ENTERPRISE_SALARIES,
  ENTERPRISE_PAYSLIPS,
  EnterprisePayslip,
  EnterpriseEmployee,
} from "@/data/mockEnterpriseData";
import { cn } from "@/lib/utils";

export default function EnterprisePayrollPage() {
  const [payslips, setPayslips] = useState<EnterprisePayslip[]>(ENTERPRISE_PAYSLIPS);
  const [activeTab, setActiveTab] = useState<"overview" | "structures" | "disbursement">("overview");
  
  // Search & Filter
  const [search, setSearch] = useState("");
  
  // Payslip Preview Modal
  const [selectedPayslip, setSelectedPayslip] = useState<{ payslip: EnterprisePayslip; employee: EnterpriseEmployee } | null>(null);

  // Totals
  const totalGross = payslips.reduce((sum, p) => sum + p.gross_earnings, 0);
  const totalDeductions = payslips.reduce((sum, p) => sum + p.gross_deductions, 0);
  const totalNet = payslips.reduce((sum, p) => sum + p.net_salary, 0);
  const totalOvertime = payslips.reduce((sum, p) => sum + p.overtime_pay, 0);

  const filteredPayslips = payslips.filter((p) => {
    const emp = ENTERPRISE_EMPLOYEES.find((e) => e.id === p.employee_id);
    const str = emp ? `${emp.first_name} ${emp.last_name} ${emp.code}`.toLowerCase() : "";
    return str.includes(search.toLowerCase());
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 p-1">
      {/* Page Header / Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
            <span>Enterprise HRMS</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">Compensation & Payroll Disbursement</span>
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-400" /> Payroll Administration (June 2026)
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => alert("Payroll batch locked and sent to banking gateway for automatic disbursement!")}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
          >
            <CheckCircle2 className="h-4 w-4" /> Run Payroll Batch Disbursement
          </button>
        </div>
      </div>

      {/* Executive Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Gross Payroll Commitment</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-100">₹{(totalGross / 1000).toFixed(1)}k</span>
              <span className="text-xs text-slate-400">Total Earnings</span>
            </div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Net Salary Disbursement</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-400">₹{(totalNet / 1000).toFixed(1)}k</span>
              <span className="text-xs text-emerald-500/80 font-medium">Bank Transfers</span>
            </div>
          </div>
          <div className="p-2.5 bg-brand-500/10 rounded-lg text-brand-400 border border-brand-500/20">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Statutory Deductions (PF/TDS)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-amber-400">₹{(totalDeductions / 1000).toFixed(1)}k</span>
              <span className="text-xs text-slate-400">Tax Compliance</span>
            </div>
          </div>
          <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Total Overtime Pay</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-purple-400">₹{totalOvertime.toLocaleString()}</span>
              <span className="text-xs text-slate-400">Approved OT</span>
            </div>
          </div>
          <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
            <Award className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition-all",
            activeTab === "overview"
              ? "bg-brand-500/15 text-brand-400 border border-brand-500/30"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Employee Payslip Register ({filteredPayslips.length})
        </button>
        <button
          onClick={() => setActiveTab("structures")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-lg transition-all",
            activeTab === "structures"
              ? "bg-brand-500/15 text-brand-400 border border-brand-500/30"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Salary Structures & Allowances
        </button>
      </div>

      {/* 1. PAYSLIP REGISTER TAB */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search employee or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-muted-foreground font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Payroll Period</th>
                    <th className="p-3.5">Gross Earnings</th>
                    <th className="p-3.5">Statutory Deductions</th>
                    <th className="p-3.5">Net Salary</th>
                    <th className="p-3.5">Disbursement Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredPayslips.map((ps) => {
                    const emp = ENTERPRISE_EMPLOYEES.find((e) => e.id === ps.employee_id);
                    if (!emp) return null;
                    return (
                      <tr key={ps.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img src={emp.avatar} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-800" />
                            <div>
                              <span className="font-bold text-slate-100 block">{emp.first_name} {emp.last_name}</span>
                              <span className="text-[10px] text-slate-400">{emp.code} • {emp.designation}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-medium text-slate-300">{ps.period}</td>
                        <td className="p-3.5 font-bold text-slate-100">₹{ps.gross_earnings.toLocaleString()}</td>
                        <td className="p-3.5 font-medium text-amber-400">₹{ps.gross_deductions.toLocaleString()}</td>
                        <td className="p-3.5 font-bold text-emerald-400">₹{ps.net_salary.toLocaleString()}</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            {ps.status} ({ps.paid_date})
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedPayslip({ payslip: ps, employee: emp })}
                            className="px-2.5 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 rounded text-[11px] font-semibold transition-colors border border-brand-500/20 flex items-center gap-1 ml-auto"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Payslip
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. SALARY STRUCTURES TAB */}
      {activeTab === "structures" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ENTERPRISE_EMPLOYEES.map((emp) => {
            const sal = ENTERPRISE_SALARIES[emp.id];
            if (!sal) return null;
            const gross = sal.basic_salary + sal.hra + sal.conveyance_allowance + sal.special_allowance;
            const deds = sal.pf_deduction + sal.esi_deduction + sal.tds_tax_deduction;
            return (
              <div key={emp.id} className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <img src={emp.avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-800" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{emp.first_name} {emp.last_name}</h4>
                    <span className="text-[10px] text-slate-400">{emp.designation} • CTC Component Breakdown</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Earnings</span>
                    <div className="flex justify-between text-slate-300"><span>Basic Pay</span><span className="font-semibold">₹{sal.basic_salary}</span></div>
                    <div className="flex justify-between text-slate-300"><span>HRA</span><span className="font-semibold">₹{sal.hra}</span></div>
                    <div className="flex justify-between text-slate-300"><span>Special Allowance</span><span className="font-semibold">₹{sal.special_allowance}</span></div>
                  </div>
                  <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">Statutory Deductions</span>
                    <div className="flex justify-between text-slate-300"><span>Provident Fund (PF)</span><span className="font-semibold">₹{sal.pf_deduction}</span></div>
                    <div className="flex justify-between text-slate-300"><span>TDS Income Tax</span><span className="font-semibold">₹{sal.tds_tax_deduction}</span></div>
                    <div className="flex justify-between text-slate-300"><span>OT Rate/hr</span><span className="font-semibold">₹{sal.overtime_hourly_rate}</span></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRINTABLE PAYSLIP MODAL */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-brand-400" /> EOMS Engineering Services Pvt Ltd
                </h3>
                <span className="text-xs text-slate-400">Salary Slip for the period of {selectedPayslip.payslip.period}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center gap-1">
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
                <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-slate-100 p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Employee Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div><span className="text-[10px] text-slate-400 block">Employee Name</span><span className="font-bold text-slate-100">{selectedPayslip.employee.first_name} {selectedPayslip.employee.last_name}</span></div>
              <div><span className="text-[10px] text-slate-400 block">Staff Code</span><span className="font-mono font-bold text-brand-400">{selectedPayslip.employee.code}</span></div>
              <div><span className="text-[10px] text-slate-400 block">Designation</span><span className="font-medium text-slate-300">{selectedPayslip.employee.designation}</span></div>
              <div><span className="text-[10px] text-slate-400 block">Department</span><span className="font-medium text-slate-300">{selectedPayslip.employee.department}</span></div>
              <div><span className="text-[10px] text-slate-400 block">Bank Account</span><span className="font-mono text-slate-300">HDFC-****9821</span></div>
              <div><span className="text-[10px] text-slate-400 block">PF UAN</span><span className="font-mono text-slate-300">100928192831</span></div>
            </div>

            {/* Earnings & Deductions Table */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold text-emerald-400 border-b border-slate-800 pb-1 uppercase text-[10px]">Earnings</h4>
                <div className="flex justify-between py-1 border-b border-slate-800/40 text-slate-300"><span>Gross Salary</span><span className="font-bold">₹{selectedPayslip.payslip.gross_earnings.toLocaleString()}</span></div>
                {selectedPayslip.payslip.overtime_pay > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-800/40 text-slate-300"><span>Overtime Allowance</span><span className="font-bold">₹{selectedPayslip.payslip.overtime_pay.toLocaleString()}</span></div>
                )}
                {selectedPayslip.payslip.bonus > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-800/40 text-slate-300"><span>Performance Bonus</span><span className="font-bold">₹{selectedPayslip.payslip.bonus.toLocaleString()}</span></div>
                )}
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-amber-400 border-b border-slate-800 pb-1 uppercase text-[10px]">Deductions</h4>
                <div className="flex justify-between py-1 border-b border-slate-800/40 text-slate-300"><span>Provident Fund & TDS</span><span className="font-bold">₹{selectedPayslip.payslip.gross_deductions.toLocaleString()}</span></div>
              </div>
            </div>

            {/* Net Salary Summary Box */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Take-Home Net Salary</span>
                <span className="text-xs text-slate-400">Transferred via Direct Bank Deposit</span>
              </div>
              <span className="text-2xl font-extrabold text-emerald-400">₹{selectedPayslip.payslip.net_salary.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
