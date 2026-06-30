"use client";

import React, { useState } from "react";
import {
  IndianRupee,
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
} from "@/data/mockEnterpriseData";
import { getPayslips, getSalaryStructures, generatePayslips } from "@/lib/api/payroll";
import { getEmployees } from "@/lib/api/employees";
import { cn } from "@/lib/utils";

export default function EnterprisePayrollPage() {
  const [payslips, setPayslips] = useState<EnterprisePayslip[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<EnterpriseSalaryStructure[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function loadData() {
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
    }
    loadData();
  }, []);

  const handleGeneratePayslips = async () => {
    try {
      const generated = await generatePayslips("June 2026");
      setPayslips(generated);
    } catch (err) {
      console.error(err);
    }
  };

  const [activeTab, setActiveTab] = useState<"payslips" | "structures" | "preview">("payslips");
  const [search, setSearch] = useState("");
  const [selectedPayslip, setSelectedPayslip] = useState<EnterprisePayslip | null>(null);

  const totalGross = payslips.reduce((sum, p) => sum + p.gross_earnings, 0);
  const totalNet = payslips.reduce((sum, p) => sum + p.net_salary, 0);
  const totalDeductions = payslips.reduce((sum, p) => sum + p.gross_deductions, 0);
  const totalOT = payslips.reduce((sum, p) => sum + (p.overtime_pay || 0), 0);

  const filteredPayslips = payslips.filter((p) => {
    const emp = employees.find((e) => e.id === p.employee_id);
    const name = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : "";
    return name.includes(search.toLowerCase()) || p.employee_id.toLowerCase().includes(search.toLowerCase());
  });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

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
            <span className="p-1.5 bg-blue-50 rounded-lg"><IndianRupee className="h-5 w-5 text-blue-600" /></span>
            Payroll Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage compensation, generate payslips, and track statutory deductions.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-slate-600 shadow-sm">
            Pay Period: June 2026
          </span>
          <button
            onClick={handleGeneratePayslips}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Generate Payslips
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gross Payroll", value: formatCurrency(totalGross), sub: "Total CTC commitment", icon: <IndianRupee className="h-5 w-5 text-blue-600" />, iconBg: "bg-blue-50" },
          { label: "Net Disbursement", value: formatCurrency(totalNet), sub: "Take-home salary total", icon: <Landmark className="h-5 w-5 text-emerald-600" />, iconBg: "bg-emerald-50" },
          { label: "PF + TDS Deductions", value: formatCurrency(totalDeductions), sub: "Statutory compliance", icon: <ShieldCheck className="h-5 w-5 text-amber-500" />, iconBg: "bg-amber-50" },
          { label: "Overtime Pay", value: formatCurrency(totalOT), sub: "Approved OT hours", icon: <Clock className="h-5 w-5 text-purple-600" />, iconBg: "bg-purple-50" },
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
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {salaryStructures.map((ss) => {
              const emp = employees.find((e) => e.id === ss.employee_id);
              if (!emp) return null;
              const totalEarnings = ss.basic_salary + ss.hra + ss.special_allowance + ss.conveyance_allowance;
              const totalDeds = ss.pf_deduction + ss.esi_deduction + ss.tds_tax_deduction;
              return (
                <div key={ss.employee_id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar} alt="" className="h-10 w-10 rounded-full ring-2 ring-gray-100 object-cover" />
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs text-slate-500">{emp.designation} · {emp.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Monthly CTC</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(totalEarnings)}</p>
                    </div>
                  </div>
                  {/* Body */}
                  <div className="grid grid-cols-2 gap-0 divide-x divide-gray-100">
                    {/* Earnings */}
                    <div className="p-4 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1 pb-1 border-b border-emerald-100">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Earnings
                      </h4>
                      {[
                        { label: "Basic Salary", value: ss.basic_salary },
                        { label: "HRA", value: ss.hra },
                        { label: "Special Allowance", value: ss.special_allowance },
                        { label: "Conveyance", value: ss.conveyance_allowance },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between text-sm">
                          <span className="text-slate-600">{item.label}</span>
                          <span className="font-semibold text-gray-800">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm pt-2 border-t border-emerald-100 font-bold">
                        <span className="text-emerald-700">Total Earnings</span>
                        <span className="text-emerald-700">{formatCurrency(totalEarnings)}</span>
                      </div>
                    </div>
                    {/* Deductions */}
                    <div className="p-4 space-y-2">
                      <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1 pb-1 border-b border-red-100">
                        <span className="h-2 w-2 rounded-full bg-red-500" /> Deductions
                      </h4>
                      {[
                        { label: "PF (Employee)", value: ss.pf_deduction },
                        { label: "ESI", value: ss.esi_deduction },
                        { label: "TDS", value: ss.tds_tax_deduction },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between text-sm">
                          <span className="text-slate-600">{item.label}</span>
                          <span className="font-semibold text-red-600">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm pt-2 border-t border-red-100 font-bold">
                        <span className="text-red-700">Total Deductions</span>
                        <span className="text-red-700">{formatCurrency(totalDeds)}</span>
                      </div>
                    </div>
                  </div>
                  {/* Net */}
                  <div className="px-5 py-3 bg-blue-50 border-t border-blue-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-blue-800">Net Monthly Salary</span>
                    <span className="text-xl font-extrabold text-blue-800">{formatCurrency(totalEarnings - totalDeds)}</span>
                  </div>
                  {/* OT Rate */}
                  <div className="px-5 py-2 border-t border-gray-100 flex justify-between items-center text-xs text-slate-500">
                    <span>Overtime Hourly Rate</span>
                    <span className="font-bold text-gray-700">{formatCurrency(ss.overtime_hourly_rate)}/hr</span>
                  </div>
                </div>
              );
            })}
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
                      { label: "Basic Salary", value: ss.basic_salary },
                      { label: "HRA", value: ss.hra },
                      { label: "Special Allowance", value: ss.special_allowance },
                      { label: "Conveyance", value: ss.conveyance_allowance },
                      ...(selectedPayslip.overtime_pay ? [{ label: "Overtime Pay", value: selectedPayslip.overtime_pay }] : []),
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
                      { label: "PF (Employee)", value: ss.pf_deduction },
                      { label: "ESI", value: ss.esi_deduction },
                      { label: "TDS", value: ss.tds_tax_deduction },
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
    </div>
  );
}
