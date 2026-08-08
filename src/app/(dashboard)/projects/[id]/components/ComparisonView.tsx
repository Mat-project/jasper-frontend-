import React from 'react';
import { FilePlus, FileMinus, FileEdit, FileCheck } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ComparisonData {
  added: string[];
  removed: string[];
  modified: { drawingNumber: string; oldWeight?: number; newWeight?: number; oldRev?: string; newRev?: string }[];
  unchanged?: string[];
}

export const ComparisonView = ({ data, vFrom, vTo }: { data: ComparisonData, vFrom: number, vTo: number }) => {
  const added = data?.added || [];
  const removed = data?.removed || [];
  const modified = data?.modified || [];
  const unchanged = data?.unchanged || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Revision Summary</h2>
          <p className="text-sm text-slate-500">Changes from Version {vFrom} to Version {vTo}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col gap-2">
          <div className="p-2 w-fit rounded-lg bg-emerald-50 text-emerald-600 mb-1">
            <FilePlus className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">+{added.length}</div>
          <div className="text-sm font-medium text-slate-500">New Drawings</div>
        </div>
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col gap-2">
          <div className="p-2 w-fit rounded-lg bg-red-50 text-red-600 mb-1">
            <FileMinus className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">-{removed.length}</div>
          <div className="text-sm font-medium text-slate-500">Removed Drawings</div>
        </div>
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col gap-2">
          <div className="p-2 w-fit rounded-lg bg-amber-50 text-amber-600 mb-1">
            <FileEdit className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{modified.length}</div>
          <div className="text-sm font-medium text-slate-500">Updated Drawings</div>
        </div>
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col gap-2">
          <div className="p-2 w-fit rounded-lg bg-blue-50 text-blue-600 mb-1">
            <FileCheck className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{unchanged.length}</div>
          <div className="text-sm font-medium text-slate-500">Unchanged Drawings</div>
        </div>
      </div>

      <div className="space-y-6">
        {added.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2">
              <FilePlus className="w-4 h-4"/> Added Drawings
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Drawing Number</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {added.map(dwg => (
                    <tr key={dwg} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{dwg}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">Added</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {modified.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
              <FileEdit className="w-4 h-4"/> Updated Drawings
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Drawing Number</th>
                    <th className="px-4 py-3">Revision Change</th>
                    <th className="px-4 py-3">Weight Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {modified.map(dwg => (
                    <tr key={dwg.drawingNumber} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{dwg.drawingNumber}</td>
                      <td className="px-4 py-3">
                        {dwg.oldRev && dwg.newRev ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded bg-red-50 text-red-700 border border-red-100 text-xs line-through">Rev {dwg.oldRev}</span>
                            <span className="text-slate-400">→</span>
                            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium">Rev {dwg.newRev}</span>
                          </div>
                        ) : <span className="text-slate-400 italic text-xs">Unchanged</span>}
                      </td>
                      <td className="px-4 py-3">
                        {dwg.oldWeight && dwg.newWeight ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded bg-red-50 text-red-700 border border-red-100 text-xs line-through">{dwg.oldWeight} kg</span>
                            <span className="text-slate-400">→</span>
                            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium">{dwg.newWeight} kg</span>
                          </div>
                        ) : <span className="text-slate-400 italic text-xs">Unchanged</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
