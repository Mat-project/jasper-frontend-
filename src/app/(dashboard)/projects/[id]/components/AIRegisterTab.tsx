"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import UploadZIP from "./UploadZIP";
import ProcessingStatus from "./ProcessingStatus";
import ActiveSubmissionBanner from "./ActiveSubmissionBanner";
import { getAccessToken, getBaseUrl } from "@/lib/api/client";
import { useProjectWorkspace } from "../WorkspaceProvider";

export default function AIRegisterTab({ project }: { project: any }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobState, setJobState] = useState<any>({ state: "IDLE", job_state: "IDLE" });
  const prevJobState = useRef<any>(null);

  // Shared workspace context — single source of truth for the active
  // submission across all Register AI tabs.
  const { workspace } = useProjectWorkspace();

  const isUserUploadingRef = useRef(false);

  useEffect(() => {
    if (
      isUserUploadingRef.current &&
      prevJobState.current &&
      prevJobState.current.job_state !== "Completed" &&
      jobState &&
      jobState.job_state === "Completed"
    ) {
      isUserUploadingRef.current = false;
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

  // Check for any in-flight or latest job on initial page mount
  useEffect(() => {
    let isMounted = true;
    fetchStatus().then((data) => {
      if (!isMounted || !data) return;
      if (data.job_state && data.job_state !== "IDLE") {
        setJobState(data);
        const stateUpper = (data.job_state || "").toUpperCase();
        if (["INITIALIZING", "UNPACKING", "READING_PDFS", "EXTRACTING_METADATA", "BUILDING_RELATIONSHIPS", "QUEUED"].includes(stateUpper)) {
          setJobId(data.id || "active");
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fetchStatus]);

  // Polling effect: ONLY active when jobId is set (starts ONLY after successful ZIP upload)
  useEffect(() => {
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

      // Stop polling when job reaches terminal state: COMPLETED, FAILED, or CANCELLED
      if (["COMPLETED", "FAILED", "CANCELLED"].includes(stateUpper)) {
        setJobId(null);
      }
    };

    // Trigger immediate poll upon acquiring jobId, then poll on 3s interval
    poll();
    const intervalId = setInterval(poll, 3000);

    // Clear interval on component unmount or when jobId resets
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [jobId, fetchStatus]);

  // Callback executed ONLY after successful ZIP upload returns a job_id
  const handleUploadSuccess = (newJobId?: string) => {
    if (newJobId) {
      isUserUploadingRef.current = true;
      setJobId(newJobId);
    }
  };

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
