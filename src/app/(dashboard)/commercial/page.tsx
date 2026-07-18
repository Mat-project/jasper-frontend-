"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Building2,
  ChevronRight,
  PieChart,
  BarChart,
} from "lucide-react";
import { getProjects } from "@/lib/api/projects";
import { cn } from "@/lib/utils";
import { getProjectCommercialSummary } from "@/lib/api/commercial";

export default function CommercialDashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const projs = await getProjects();
        setProjects(projs);

        // Fetch commercial summary for each active project
        const summaryData: Record<string, any> = {};
        await Promise.all(
          projs.map(async (p: any) => {
            try {
              const res = await getProjectCommercialSummary(p.id);
              summaryData[p.id] = res;
            } catch (err) {
              // Ignore if commercial data not available
            }
          })
        );
        setSummaries(summaryData);
      } catch (err) {
        console.error("Failed to load commercial dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Aggregated Metrics
  let totalRevenue = 0;
  let totalOutstanding = 0;
  let lockedProjects = 0;

  projects.forEach((p) => {
    const sum = summaries[p.id];
    if (sum) {
      totalRevenue += parseFloat(sum.total_invoiced || "0");
      totalOutstanding += parseFloat(sum.total_outstanding || "0");
      if (sum.commercial_locked) lockedProjects++;
    }
  });

  const topOutstanding = projects
    .filter((p) => summaries[p.id] && parseFloat(summaries[p.id].total_outstanding) > 0)
    .sort((a, b) => parseFloat(summaries[b.id].total_outstanding) - parseFloat(summaries[a.id].total_outstanding))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <span>Enterprise HRMS</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600 font-semibold">Commercial Overview</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <span className="p-1.5 bg-emerald-50 rounded-lg"><DollarSign className="h-5 w-5 text-emerald-600" /></span>
            Commercial Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">Company-wide revenue, invoicing, and outstanding payments.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue Invoiced", value: `AED ${totalRevenue.toLocaleString()}`, sub: "YTD Total", icon: <TrendingUp className="h-5 w-5 text-blue-600" />, iconBg: "bg-blue-50", valueColor: "text-gray-900" },
          { label: "Total Outstanding", value: `AED ${totalOutstanding.toLocaleString()}`, sub: "Across all projects", icon: <AlertTriangle className="h-5 w-5 text-amber-500" />, iconBg: "bg-amber-50", valueColor: "text-amber-600" },
          { label: "Active Commercial Projects", value: projects.length, sub: `${lockedProjects} with locked value`, icon: <Building2 className="h-5 w-5 text-emerald-600" />, iconBg: "bg-emerald-50", valueColor: "text-gray-900" },
          { label: "Pending Invoices", value: 0, sub: "Draft / Under Review", icon: <FileCheck className="h-5 w-5 text-purple-600" />, iconBg: "bg-purple-50", valueColor: "text-gray-900" },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
            </div>
            <div className={`p-3 ${card.iconBg} rounded-xl`}>{card.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Projects by Outstanding */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart className="h-5 w-5 text-blue-600" />
            Top 5 Projects by Outstanding Balance
          </h3>
          {topOutstanding.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p>No outstanding balances found across active projects.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-slate-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3 text-right">Total Invoiced</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topOutstanding.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{p.name} ({p.code})</td>
                      <td className="px-4 py-3 text-gray-600">{p.client}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {p.currency} {parseFloat(summaries[p.id].total_invoiced || "0").toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">
                        {p.currency} {parseFloat(summaries[p.id].total_outstanding || "0").toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invoice Pipeline (Placeholder for Chart) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            Invoice Status Pipeline
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Draft / Under Review</span>
              <span className="font-bold text-gray-900">0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-sm font-semibold text-blue-700">Approved</span>
              <span className="font-bold text-blue-900">0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
              <span className="text-sm font-semibold text-amber-700">Sent (Pending Payment)</span>
              <span className="font-bold text-amber-900">0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="text-sm font-semibold text-emerald-700">Paid (This Month)</span>
              <span className="font-bold text-emerald-900">0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
