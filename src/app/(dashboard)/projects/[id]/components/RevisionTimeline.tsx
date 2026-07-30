import React from 'react';
import { Clock, CheckCircle, Send, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Version {
  versionNumber: number;
  status: string;
  generatedAt: string;
  createdBy: string;
}

export const RevisionTimeline = ({ versions, activeVersion, onSelect }: { versions: Version[], activeVersion: number, onSelect: (v: number) => void }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle className="w-4 h-4 text-emerald-600 inline mr-1" />;
      case 'Sent': return <Send className="w-4 h-4 text-blue-600 inline mr-1" />;
      case 'Superseded': return <Clock className="w-4 h-4 text-slate-400 inline mr-1" />;
      default: return <AlertCircle className="w-4 h-4 text-amber-600 inline mr-1" />;
    }
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Revision History</h2>
      <p className="text-sm text-slate-500 mb-6">Select a version to view differences</p>
      
      <div className="relative pl-4 border-l-2 border-gray-100 flex flex-col gap-6">
        {versions.map((v) => {
          const isActive = activeVersion === v.versionNumber;
          const isSuperseded = v.status === 'Superseded';
          return (
            <div 
              key={v.versionNumber} 
              className="relative pl-6 cursor-pointer group"
              onClick={() => onSelect(v.versionNumber)}
            >
              {/* Timeline dot */}
              <div className={cn(
                "absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 transition-all",
                isActive ? "bg-blue-600 border-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]" : 
                isSuperseded ? "bg-white border-gray-300" : "bg-white border-gray-400 group-hover:border-blue-500"
              )} />
              
              <div className={cn(
                "p-4 rounded-xl border transition-all",
                isActive ? "bg-blue-50/50 border-blue-200" : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
              )}>
                <div className={cn(
                  "inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold mb-2 border",
                  isActive ? "bg-white border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600"
                )}>
                  Version {v.versionNumber}
                </div>
                <div className="flex items-center text-sm font-semibold text-gray-900 mb-2">
                  {getStatusIcon(v.status)}
                  {v.status}
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>Generated: {new Date(v.generatedAt).toLocaleDateString()}</p>
                  <p>By: {v.createdBy}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
