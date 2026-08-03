"use client";

import React from "react";
import { Loader2, ShieldCheck, Search, FileText, Cpu, Network, AlertTriangle, RotateCcw } from "lucide-react";

export default function ProcessingStatus({ jobState }: { jobState: any }) {
  const { 
    progress_percentage, 
    current_step_description, 
    job_state, 
    filename,
    failed_stage,
    error_reason,
    retry_count,
    retry_available
  } = jobState;

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

  // If job failed, show error state
  if (job_state === "Failed") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-gray-900">Processing Failed</h3>
          <p className="text-slate-500 font-medium">{filename}</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900">
                {failed_stage ? `Failed at: ${failed_stage.replace(/_/g, " ")}` : "Processing encountered an error"}
              </h4>
              {error_reason && (
                <p className="text-red-700 text-sm mt-2">{error_reason}</p>
              )}
            </div>
          </div>

          {/* Retry Information */}
          <div className="bg-white rounded-lg p-4 border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Retry Status</p>
                <p className="text-sm text-gray-600 mt-1">
                  {retry_count && retry_available ? (
                    <>Retry attempt {retry_count} of 3. System will retry automatically.</>
                  ) : retry_count && !retry_available ? (
                    <>Failed after {retry_count} attempts. Manual intervention required.</>
                  ) : (
                    <>System will attempt to retry this job automatically.</>
                  )}
                </p>
              </div>
              {retry_available && (
                <div className="flex items-center gap-2 text-blue-600">
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-semibold">Retrying...</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              ℹ️ The system automatically retries failed jobs with exponential backoff (60s, 120s, 240s). 
              {retry_available && " Your job will be retried shortly."}
              {!retry_available && " Please contact support if this persists."}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
