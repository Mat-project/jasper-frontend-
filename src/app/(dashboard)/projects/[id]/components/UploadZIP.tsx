"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, X } from "lucide-react";
import { getAccessToken, getBaseUrl } from "@/lib/api/client";

/** Safely converts any error value (string, object, Error) to a displayable string */
function toErrorString(err: unknown): string {
  if (!err) return "An unknown error occurred.";
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
    if (typeof e.detail === "string") return e.detail;
    if (typeof e.error === "string") return e.error;
    // Last resort: JSON-stringify so it never renders as an object
    try { return JSON.stringify(err); } catch { return "An unknown error occurred."; }
  }
  return String(err);
}

export default function UploadZIP({
  project,
  onUploadSuccess,
  lastJob,
}: {
  project: any;
  onUploadSuccess: () => void;
  lastJob: any;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(
        `${baseUrl}/api/v1/projects/${project.id}/upload/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          body: formData,
        }
      );

      if (res.ok) {
        setFile(null);
        window.dispatchEvent(new Event("zip-upload-started"));
        onUploadSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        // Always convert to string — never store raw object in state
        setErrorMsg(toErrorString(data.error ?? data.detail ?? data));
      }
    } catch (err) {
      setErrorMsg(toErrorString(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Last job: Completed banner */}
      {lastJob?.job_state === "Completed" && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Last Processing Job Completed</p>
            <p className="text-xs text-emerald-700 mt-1">
              Package &quot;{lastJob.filename}&quot; was processed on{" "}
              {lastJob.completed_at
                ? new Date(lastJob.completed_at).toLocaleString()
                : "—"}
              .
            </p>
          </div>
        </div>
      )}

      {/* Last job: Failed banner */}
      {lastJob?.job_state === "Failed" && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Last Processing Job Failed</p>
            <p className="text-xs text-red-700 mt-1">
              {toErrorString(lastJob.error_reason || lastJob.last_error_message)}
            </p>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
        <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
          <UploadCloud className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Upload ZIP Package</h3>
        <p className="text-sm text-slate-500 mb-6 text-center max-w-sm mt-2">
          Upload a ZIP file containing the engineering drawings and BBS for this
          project. Maximum size 500 MB.
        </p>

        <input
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          className="hidden"
          id="zip-upload"
        />

        {!file ? (
          <label
            htmlFor="zip-upload"
            className="cursor-pointer bg-white border border-slate-200 px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            Select ZIP File
          </label>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Selected file row */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg w-full max-w-md">
              <span className="text-sm font-medium text-slate-700 truncate">
                {file.name}
              </span>
              <span className="text-xs text-slate-400 shrink-0 ml-2">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setFile(null); setErrorMsg(null); }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center gap-1"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
              >
                {uploading && (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                )}
                {uploading ? "Uploading..." : "Start Processing"}
              </button>
            </div>
          </div>
        )}

        {/* Upload error — always a string, never an object */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium mt-4 w-full max-w-md text-center">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
