"use client";

import React, { useState, useEffect } from "react";
import UploadZIP from "./UploadZIP";
import ProcessingStatus from "./ProcessingStatus";
import { getAccessToken } from "@/lib/api/client";

export default function AIRegisterTab({ project }: { project: any }) {
  const [jobState, setJobState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(`http://localhost:8000/api/v1/projects/${project.id}/processing-status/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setJobState(data);
      } else {
        setJobState(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [project.id]);

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // If a job exists and is not Completed/Failed, show processing status.
  const isProcessing = jobState && !["Completed", "Failed"].includes(jobState.job_state);

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold text-gray-900">AI Register Automation</h2>
        <p className="text-slate-500 text-sm mt-1">Upload a ZIP package containing engineering drawings and BBS for automated processing.</p>
      </div>

      {isProcessing ? (
        <ProcessingStatus jobState={jobState} />
      ) : (
        <UploadZIP project={project} onUploadSuccess={() => fetchStatus()} lastJob={jobState} />
      )}
    </div>
  );
}
