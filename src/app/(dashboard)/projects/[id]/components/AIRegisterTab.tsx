"use client";

import React, { useState, useEffect, useRef } from "react";
import UploadZIP from "./UploadZIP";
import ProcessingStatus from "./ProcessingStatus";
import ActiveSubmissionBanner from "./ActiveSubmissionBanner";
import { getAccessToken, getBaseUrl } from "@/lib/api/client";
import { useProjectWorkspace } from "../WorkspaceProvider";

export default function AIRegisterTab({ project }: { project: any }) {
  const [jobState, setJobState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const prevJobState = useRef<any>(null);

  // Shared workspace context — single source of truth for the active
  // submission across all Register AI tabs. The provider loads it once.
  const { workspace } = useProjectWorkspace();

  useEffect(() => {
    if (
      prevJobState.current &&
      prevJobState.current.job_state !== "Completed" &&
      jobState &&
      jobState.job_state === "Completed"
    ) {
      // Notify the rest of the page (WorkspaceProvider + page-level handler)
      // that a ZIP has finished processing. The backend has already set the
      // new submission as active; listeners will refresh workspace state.
      window.dispatchEvent(new Event("zip-processing-completed"));
    }
    prevJobState.current = jobState;
  }, [jobState]);

  const fetchStatus = async () => {
    try {
      const token = getAccessToken();
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/projects/${project.id}/processing-status/`, {
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
    }
  };

  useEffect(() => {
    const initializeTab = async () => {
      await fetchStatus();
      setLoading(false);
    };

    initializeTab();

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
    <div className="space-y-4">
      {/* Active Submission banner — shared across all tabs */}
      <ActiveSubmissionBanner />

      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-900">AI Register Automation</h2>
          <p className="text-slate-500 text-sm mt-1">Upload a ZIP package containing engineering drawings and BBS for automated processing.</p>
        </div>

        {isProcessing ? (
          <ProcessingStatus jobState={jobState} />
        ) : (
          <UploadZIP
            project={project}
            onUploadSuccess={() => {
              fetchStatus();
            }}
            lastJob={jobState}
          />
        )}
      </div>
    </div>
  );
}
