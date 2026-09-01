"use client";

/**
 * DiagnosticErrorModal
 *
 * Global diagnostic modal component that intercepts and renders detailed error
 * reports for any backend API failures (4xx, 5xx, network timeouts).
 *
 * Master Toggle:
 *   Set `SHOW_DIAGNOSTIC_ERROR_MODAL = false` to disable global diagnostic popups
 *   after testing/QA is completed.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  X,
  Copy,
  Check,
  Globe,
  Clock,
  Terminal,
  ShieldAlert,
} from "lucide-react";

export const SHOW_DIAGNOSTIC_ERROR_MODAL = true;

export interface ApiErrorDetail {
  id: string;
  title: string;
  status: number;
  statusText?: string;
  url: string;
  method: string;
  message: string;
  data?: any;
  timestamp: string;
}

export function dispatchApiError(errorPayload: Omit<ApiErrorDetail, "id" | "timestamp">) {
  if (typeof window === "undefined" || !SHOW_DIAGNOSTIC_ERROR_MODAL) return;

  const fullDetail: ApiErrorDetail = {
    ...errorPayload,
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toLocaleTimeString(),
  };

  const event = new CustomEvent<ApiErrorDetail>("eoms-api-error", {
    detail: fullDetail,
  });
  window.dispatchEvent(event);
}

export function DiagnosticErrorModal() {
  const [errors, setErrors] = useState<ApiErrorDetail[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleApiError = useCallback((e: Event) => {
    if (!SHOW_DIAGNOSTIC_ERROR_MODAL) return;
    const customEvent = e as CustomEvent<ApiErrorDetail>;
    if (customEvent.detail) {
      setErrors((prev) => [customEvent.detail, ...prev].slice(0, 5)); // Keep last 5 errors max
    }
  }, []);

  useEffect(() => {
    window.addEventListener("eoms-api-error", handleApiError);
    return () => {
      window.removeEventListener("eoms-api-error", handleApiError);
    };
  }, [handleApiError]);

  const dismissError = (id: string) => {
    setErrors((prev) => prev.filter((err) => err.id !== id));
  };

  const copyErrorDetails = (err: ApiErrorDetail) => {
    const report = {
      title: err.title,
      status: err.status,
      statusText: err.statusText,
      url: err.url,
      method: err.method,
      message: err.message,
      timestamp: err.timestamp,
      backendResponseData: err.data,
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopiedId(err.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!SHOW_DIAGNOSTIC_ERROR_MODAL || errors.length === 0) return null;

  const currentError = errors[0];

  const getStatusBadge = (status: number) => {
    if (status >= 500) {
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
    }
    if (status >= 400) {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    }
    return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30";
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-rose-500/10 border-b border-rose-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(
                    currentError.status
                  )}`}
                >
                  {currentError.status ? `HTTP ${currentError.status}` : "NETWORK / CLIENT ERROR"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" /> {currentError.timestamp}
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground mt-0.5">
                {currentError.title}
              </h3>
            </div>
          </div>
          <button
            onClick={() => dismissError(currentError.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Endpoint Info */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
            <Globe className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="font-bold text-brand-600 dark:text-brand-400 uppercase">
              {currentError.method}
            </span>
            <span className="truncate flex-1">{currentError.url}</span>
          </div>

          {/* Main Error Message Callout */}
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                  {currentError.message}
                </p>
              </div>
            </div>
          </div>

          {/* Backend Response JSON Block */}
          {currentError.data && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5 font-mono">
                  <Terminal className="h-3.5 w-3.5" /> Backend Response Payload
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  application/json
                </span>
              </div>
              <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-56">
                <pre>
                  {typeof currentError.data === "object"
                    ? JSON.stringify(currentError.data, null, 2)
                    : String(currentError.data)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-border">
          <div className="text-xs text-muted-foreground">
            {errors.length > 1 && (
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                + {errors.length - 1} more error(s) queued
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => copyErrorDetails(currentError)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              {copiedId === currentError.id ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  Copied Details
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Diagnostic Report
                </>
              )}
            </button>
            <button
              onClick={() => dismissError(currentError.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
