"use client";

/**
 * ActiveSubmissionBanner
 *
 * Shown at the top of every Register AI tab.
 * Displays the current active submission from WorkspaceContext and a
 * warning when viewing a historical (read-only) submission.
 */

import React from "react";
import { AlertTriangle, FolderOpen } from "lucide-react";
import { useProjectWorkspace } from "../WorkspaceProvider";

interface ActiveSubmissionBannerProps {
  /** The submission currently selected/viewed in this tab. */
  selectedSubmissionId?: string;
  /** Human-readable label for the selected submission, e.g. "SUB-002". */
  selectedSubmissionNo?: string;
}

export default function ActiveSubmissionBanner({
  selectedSubmissionId,
  selectedSubmissionNo,
}: ActiveSubmissionBannerProps) {
  const { workspace, loading } = useProjectWorkspace();

  if (loading || !workspace) return null;

  const activeSubmissionId = workspace.active_submission;
  const activeSubmissionNo = workspace.submission_no;

  // Determine if user is viewing a historical (non-active) submission
  const isHistorical =
    selectedSubmissionId &&
    activeSubmissionId &&
    selectedSubmissionId !== activeSubmissionId;

  return (
    <div className="flex flex-col gap-2 mb-4">
      {/* Active submission chip — always shown */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700">
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="text-blue-500 font-normal">Active Submission</span>
          <span className="font-bold">
            {activeSubmissionNo ?? "—"}
          </span>
        </div>

        {/* Pill showing which submission is currently viewed */}
        {selectedSubmissionNo && selectedSubmissionId !== activeSubmissionId && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-700">
            <span className="text-amber-500 font-normal">Viewing</span>
            <span className="font-bold">{selectedSubmissionNo}</span>
          </div>
        )}
      </div>

      {/* Historical read-only warning — only when viewing a non-active submission */}
      {isHistorical && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">
              Historical Submission — Read Only
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              You are viewing{" "}
              <span className="font-bold">{selectedSubmissionNo}</span>, which is
              not the active workspace submission. Edits, additions, and
              deletions are disabled. Switch back to{" "}
              <span className="font-bold">{activeSubmissionNo}</span> to make
              changes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
