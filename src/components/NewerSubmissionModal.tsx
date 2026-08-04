"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { WorkspaceContext, updateWorkspace } from "@/lib/api/register_ai";

interface NewerSubmissionModalProps {
  isOpen: boolean;
  workspace: WorkspaceContext;
  onClose: () => void;
  onSwitch: () => void;
}

export function NewerSubmissionModal({
  isOpen,
  workspace,
  onClose,
  onSwitch,
}: NewerSubmissionModalProps) {
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async () => {
    try {
      setIsSwitching(true);
      await updateWorkspace(workspace.project, {
        active_submission_id: workspace.latest_submission_id || undefined,
        current_stage: "Relationship",
      });
      onSwitch();
      onClose();
      // Notify the project page that the active submission was just switched
      // so it can auto-navigate to Pending Relationships. The event is only
      // emitted from this modal (rendered inside the current project's
      // WorkspaceProvider), so it can never affect users in another project.
      window.dispatchEvent(new Event("workspace-submission-switched"));
    } catch (error) {
      console.error("Failed to switch submission:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Newer Submission Available
            </h2>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 mb-3">
              A newer submission ({workspace.latest_submission_no}) has been
              uploaded.
            </p>
            <p className="text-sm text-gray-700">
              Would you like to switch to the latest submission?
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSwitching}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dismiss
            </button>
            <button
              onClick={handleSwitch}
              disabled={isSwitching}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSwitching ? "Switching..." : "Switch"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
