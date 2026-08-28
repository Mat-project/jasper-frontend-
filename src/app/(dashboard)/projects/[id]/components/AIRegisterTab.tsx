"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import UploadZIP from "./UploadZIP";
import ProcessingStatus from "./ProcessingStatus";
import ActiveSubmissionBanner from "./ActiveSubmissionBanner";
import { getAccessToken, getBaseUrl } from "@/lib/api/client";
import { useProjectWorkspace } from "../WorkspaceProvider";

export default function AIRegisterTab({ project }: { project: any }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobState, setJobState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const prevJobState = useRef<any>(null);

  // Shared workspace context — single source of truth for the active
  // submission across all Register AI tabs.
  const { workspace } = useProjectWorkspace();

  useEffect(() => {
    if (
      prevJobState.current &&
      prevJobState.current.job_state !== "Completed" &&
      jobState &&
      jobState.job_state === "Completed"
    ) {
      window.dispatchEvent(new Event("zip-processing-completed"));
    }
    prevJobState.current = jobState;
  }, [jobState]);

  // Fetch status helper — returns IDLE on 404 without throwing console errors
  const fetchStatus = useCallback(async () => {
    try {
      const token = getAccessToken();
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/projects/${project.id}/processing-status/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 404) {
        return { state: "IDLE", job_state: "IDLE" };
      }

      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return { state: "IDLE", job_state: "IDLE" };
    } catch (e) {
      return { state: "IDLE", job_state: "IDLE" };
    }
  }, [project.id]);

  // Initial load check (runs once on mount)
  useEffect(() => {
    let isMounted = true;
    const initializeTab = async () => {
      const data = await fetchStatus();
      if (!isMounted) return;

      if (data && data.job_id && data.state !== "IDLE" && data.job_state !== "IDLE") {
        setJobState(data);
        const stateUpper = (data.job_state || "").toUpperCase();
        // Only set jobId to start polling if job is currently active
        if (!["COMPLETED", "FAILED", "CANCELLED"].includes(stateUpper)) {
          setJobId(data.job_id);
        }
      } else {
        setJobState({ state: "IDLE", job_state: "IDLE" });
      }
      setLoading(false);
    };

    initializeTab();
    return () => {
      isMounted = false;
    };
  }, [fetchStatus]);

  // Requirement 1, 2, 5: Polling effect driven by jobId
  useEffect(() => {
    // Only start polling if jobId exists
    if (!jobId) return;

    let isMounted = true;

    const poll = async () => {
      const data = await fetchStatus();
      if (!isMounted) return;

      if (!data || data.state === "IDLE" || data.job_state === "IDLE") {
        setJobState({ state: "IDLE", job_state: "IDLE" });
        setJobId(null); // Stop polling if job not found / IDLE
        return;
      }

      setJobState(data);
      const stateUpper = (data.job_state || "").toUpperCase();

      // Requirement 2: Stop polling when job reaches COMPLETED, FAILED, or CANCELLED
      if (["COMPLETED", "FAILED", "CANCELLED"].includes(stateUpper)) {
        setJobId(null);
      }
    };

    const intervalId = setInterval(poll, 3000);

    // Requirement 5: Clear interval on unmount or when jobId changes
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [jobId, fetchStatus]);

  const handleUploadSuccess = (newJobId?: string) => {
    if (newJobId) {
      setJobId(newJobId);
    } else {
      fetchStatus().then((data) => {
        if (data && data.job_id) {
          setJobState(data);
          const stateUpper = (data.job_state || "").toUpperCase();
          if (!["COMPLETED", "FAILED", "CANCELLED"].includes(stateUpper)) {
            setJobId(data.job_id);
          }
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show processing status if job is active and in progress
  const stateUpper = (jobState?.job_state || "").toUpperCase();
  const isProcessing =
    jobState &&
    jobState.job_state !== "IDLE" &&
    !["COMPLETED", "FAILED", "CANCELLED"].includes(stateUpper);

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
            onUploadSuccess={handleUploadSuccess}
            lastJob={jobState}
          />
        )}
      </div>
    </div>
  );
}
