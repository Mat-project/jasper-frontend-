"use client";

import React from "react";
import { Loader2, ShieldCheck, Search, FileText, Cpu, Network } from "lucide-react";

export default function ProcessingStatus({ jobState }: { jobState: any }) {
  const { progress_percentage, current_step_description, job_state, filename } = jobState;

  const steps = [
    { name: "Unpacking", icon: Search },
    { name: "Virus_Scan", icon: ShieldCheck },
    { name: "Reading_PDFs", icon: FileText },
    { name: "OCR", icon: Search },
    { name: "Extracting_Metadata", icon: Cpu },
    { name: "Building_Relationships", icon: Network },
  ];

  const getStepStatus = (stepName: string) => {
    const stepIndex = steps.findIndex(s => s.name === stepName);
    const currentIndex = steps.findIndex(s => s.name === job_state);
    
    if (job_state === "Completed" || currentIndex > stepIndex) return "completed";
    if (currentIndex === stepIndex) return "active";
    return "pending";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">Processing Package</h3>
        <p className="text-slate-500 font-medium">{filename}</p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8">
        <div className="flex justify-between text-sm font-semibold mb-2">
          <span className="text-blue-700">{current_step_description || "Initializing..."}</span>
          <span className="text-blue-700">{progress_percentage}%</span>
        </div>
        
        <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out relative"
            style={{ width: `${progress_percentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-6">
          {steps.map((step) => {
            const status = getStepStatus(step.name);
            const Icon = step.icon;
            
            return (
              <div key={step.name} className={`flex flex-col items-center gap-3 p-4 rounded-lg border ${
                status === "completed" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                status === "active" ? "bg-white border-blue-200 shadow-sm text-blue-700" :
                "bg-transparent border-transparent text-slate-400"
              }`}>
                <div className={`p-3 rounded-full ${
                  status === "completed" ? "bg-emerald-100" :
                  status === "active" ? "bg-blue-100 animate-pulse" :
                  "bg-slate-100"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-center">
                  {step.name.replace(/_/g, " ")}
                </span>
                {status === "active" && (
                  <span className="text-xs animate-pulse">Processing...</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
