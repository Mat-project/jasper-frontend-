"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, X, CloudUpload } from "lucide-react";
import apiClient, { getBaseUrl } from "@/lib/api/client";
import { dispatchApiError } from "@/components/DiagnosticErrorModal";

/** Safely converts any error value (string, object, Error) to a displayable string */
function toErrorString(err: unknown): string {
  if (!err) return "An unknown error occurred.";
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
    if (typeof e.detail === "string") return e.detail;
    if (typeof e.error === "string") return e.error;
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
  onUploadSuccess: (jobId?: string) => void;
  lastJob: any;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
      setUploadProgress(0);
      setUploadStatusText("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);
    setUploadProgress(0);
    setUploadStatusText("Initializing upload...");

    try {
      // Step 1: Request Direct S3 Pre-signed upload URL (with 2 min timeout for slow networks)
      const presignRes = await apiClient.post(
        `/api/v1/projects/${project.id}/get-upload-url/`,
        {
          filename: file.name,
          file_size: file.size,
          content_type: file.type || "application/zip",
        },
        { timeout: 120_000 }
      );

      const { direct_s3, upload_url, s3_key } = presignRes.data || {};

      if (direct_s3 && upload_url && s3_key) {
        // Step 2A: Direct S3 Pre-signed Upload (Supports 0MB to 500MB+)
        setUploadStatusText(`Uploading directly to Cloud Storage (S3)...`);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", upload_url, true);
          xhr.setRequestHeader("Content-Type", file.type || "application/zip");

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percent);
              const loadedMB = (event.loaded / (1024 * 1024)).toFixed(1);
              const totalMB = (event.total / (1024 * 1024)).toFixed(1);
              setUploadStatusText(`Uploading to Cloud Storage: ${percent}% (${loadedMB} MB / ${totalMB} MB)`);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`S3 Cloud Upload failed with HTTP ${xhr.status}: ${xhr.statusText}`));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Network error during direct S3 cloud upload. Check your internet connection or S3 bucket CORS."));
          };

          xhr.send(file);
        });

        // Step 2B: Confirm upload and trigger Celery processing (with 2 min timeout)
        setUploadStatusText("Confirming upload and starting AI extraction...");
        const completeRes = await apiClient.post(
          `/api/v1/projects/${project.id}/complete-upload/`,
          {
            s3_key: s3_key,
            filename: file.name,
            file_size: file.size,
          },
          { timeout: 120_000 }
        );

        setFile(null);
        setUploadProgress(100);
        window.dispatchEvent(new Event("zip-upload-started"));
        onUploadSuccess(completeRes.data?.job_id);
      } else {
        // Fallback: Standard Server Upload via Authenticated apiClient
        setUploadStatusText("Uploading to server...");
        const formData = new FormData();
        formData.append("file", file);

        const res = await apiClient.post(
          `/api/v1/projects/${project.id}/upload/`,
          formData,
          {
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percent);
                const loadedMB = (progressEvent.loaded / (1024 * 1024)).toFixed(1);
                const totalMB = (progressEvent.total / (1024 * 1024)).toFixed(1);
                setUploadStatusText(`Uploading: ${percent}% (${loadedMB} MB / ${totalMB} MB)`);
              }
            },
          }
        );

        setFile(null);
        setUploadProgress(100);
        window.dispatchEvent(new Event("zip-upload-started"));
        onUploadSuccess(res.data?.job_id);
      }
    } catch (err: any) {
      const errStr = toErrorString(err?.response?.data?.error ?? err?.response?.data?.detail ?? err?.message ?? err);
      const failedUrl = err?.config?.url 
        ? (err.config.url.startsWith("http") ? err.config.url : `${getBaseUrl()}${err.config.url}`)
        : `${getBaseUrl()}/api/v1/projects/${project.id}/get-upload-url/`;

      setErrorMsg(errStr);
      dispatchApiError({
        title: "ZIP Upload Failed",
        status: err?.response?.status ?? 0,
        url: failedUrl,
        method: err?.config?.method ? err.config.method.toUpperCase() : "POST",
        message: errStr,
        data: err?.response?.data ?? String(err),
      });
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
      <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
        <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <UploadCloud className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Upload ZIP Package</h3>
        <p className="text-sm text-slate-500 mb-6 text-center max-w-md mt-1">
          Upload a ZIP package containing CAD engineering drawings and BBS schedules. Supports up to <strong className="text-slate-700 font-semibold">500 MB</strong> via direct cloud storage.
        </p>

        <input
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          className="hidden"
          id="zip-upload"
          disabled={uploading}
        />

        {!file ? (
          <label
            htmlFor="zip-upload"
            className="cursor-pointer bg-white border border-slate-200 px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
          >
            <CloudUpload className="w-4 h-4 text-blue-600" />
            Select ZIP File (0MB – 500MB)
          </label>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-lg">
            {/* Selected file row */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-3.5 rounded-lg w-full shadow-sm">
              <div className="flex items-center gap-2 truncate">
                <UploadCloud className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-sm font-semibold text-slate-700 truncate">
                  {file.name}
                </span>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 shrink-0 ml-2">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>

            {/* Live Upload Progress Bar */}
            {uploading && (
              <div className="w-full space-y-2 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="truncate">{uploadStatusText || "Uploading..."}</span>
                  <span className="text-blue-600 font-bold ml-2">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setFile(null); setErrorMsg(null); setUploadProgress(0); }}
                disabled={uploading}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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
                {uploading ? "Processing..." : "Start Processing"}
              </button>
            </div>
          </div>
        )}

        {/* Upload error */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium mt-4 w-full max-w-lg text-center">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
