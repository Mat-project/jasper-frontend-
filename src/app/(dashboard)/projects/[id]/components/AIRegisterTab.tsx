"use client";

import React, { useState, useEffect, useRef } from "react";
import UploadZIP from "./UploadZIP";
import ProcessingStatus from "./ProcessingStatus";
import { getAccessToken } from "@/lib/api/client";
import { getWorkspace, updateWorkspace, WorkspaceContext } from "@/lib/api/register_ai";
import { NewerSubmissionModal } from "@/components/NewerSubmissionModal";

export default function AIRegisterTab({ project }: { project: any }) {
  const [jobState, setJobState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<WorkspaceContext | null>(null);
  const [showNewerSubmissionModal, setShowNewerSubmissionModal] = useState(false);
  const prevJobState = useRef<any>(null);

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
    }
  };

  const loadWorkspace = async () => {
    try {
      const ws = await getWorkspace(project.id);
      setWorkspace(ws);
      
      // Show modal if newer submission available
      if (ws.newer_submission_available) {
        setShowNewerSubmissionModal(true);
      }
    } catch (error) {
      console.error("Failed to load workspace:", error);
    }
  };

  const handleProcessingStarted = async () => {
    try {
      await updateWorkspace(project.id, {
        current_stage: "Relationship",
      });
      await loadWorkspace();
    } catch (error) {
      console.error("Failed to update workspace:", error);
    }
  };

  useEffect(() => {
    const initializeTab = async () => {
      await fetchStatus();
      await loadWorkspace();
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
            handleProcessingStarted();
          }} 
          lastJob={jobState} 
        />
      )}

      {workspace && (
        <NewerSubmissionModal
          isOpen={showNewerSubmissionModal}
          workspace={workspace}
          onClose={() => setShowNewerSubmissionModal(false)}
          onSwitch={() => {
            loadWorkspace();
            fetchStatus();
          }}
        />
      )}
    </div>
  );
}
