"use client";

import React, { useState, useEffect, useCallback } from "react";
import UploadZIP from "./UploadZIP";
import ProcessingStatus from "./ProcessingStatus";
import RelationshipConfirmation from "./RelationshipConfirmation";
import RegisterReview from "./RegisterReview";
import { getAccessToken } from "@/lib/api/client";
import {
  getRelationships,
  getRegisters,
  getRegisterRows,
  Relationship,
  Register,
  RegisterRow,
} from "@/lib/api/register_ai";

// ─── Pipeline stages ──────────────────────────────────────────────────────────
// upload → processing → relationships → register
type Stage = "upload" | "processing" | "relationships" | "register";

// ─── Component ────────────────────────────────────────────────────────────────
export default function AIRegisterTab({ project }: { project: any }) {
  const [stage, setStage] = useState<Stage>("upload");
  const [jobState, setJobState] = useState<any>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [register, setRegister] = useState<Register | null>(null);
  const [rows, setRows] = useState<RegisterRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Fetch the latest processing job status ──────────────────────────────
  const fetchJobStatus = useCallback(async (): Promise<any> => {
    try {
      const token = getAccessToken();
      const res = await fetch(
        `http://localhost:8000/api/v1/projects/${project.id}/processing-status/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setJobState(data);
        return data;
      }
    } catch {
      /* Network error — silently ignore during polling */
    }
    return null;
  }, [project.id]);

  // ─── Determine which stage to show based on current data ─────────────────
  const determineStage = useCallback(
    async (job: any) => {
      // No job yet — show upload
      if (!job) {
        setStage("upload");
        return;
      }

      const state: string = job.job_state ?? "";

      // Failed — back to upload so user can retry
      if (state === "Failed") {
        setStage("upload");
        return;
      }

      // Active processing
      if (!["Completed"].includes(state)) {
        setStage("processing");
        return;
      }

      // Job completed — check for pending relationships
      try {
        const rels = await getRelationships(project.id);
        setRelationships(rels);

        const hasPending = rels.some((r) => r.status === "Proposed");
        if (hasPending || rels.length === 0) {
          // Still needs human review (or nothing at all — show relationship screen to
          // make the "empty" state clear rather than jumping to register)
          if (rels.length === 0) {
            // Nothing extracted — fallback to upload screen
            setStage("upload");
          } else {
            setStage("relationships");
          }
          return;
        }

        // All relationships resolved — check for a generated register
        const regs = await getRegisters(project.id);
        if (regs.length > 0) {
          const latestReg = regs[0]; // ordered by -version_number
          const regRows = await getRegisterRows(project.id, latestReg.id);
          setRegister(latestReg);
          setRows(regRows);
          setStage("register");
        } else {
          // Relationships confirmed but register not generated yet
          setStage("relationships");
        }
      } catch {
        // API error — remain on current stage
      }
    },
    [project.id]
  );

  // ─── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      const job = await fetchJobStatus();
      await determineStage(job);
      setLoading(false);
    })();
  }, [fetchJobStatus, determineStage]);

  // ─── Poll while processing ─────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "processing") return;

    const interval = setInterval(async () => {
      const job = await fetchJobStatus();
      if (job && job.job_state === "Completed") {
        clearInterval(interval);
        await determineStage(job);
      } else if (job && job.job_state === "Failed") {
        clearInterval(interval);
        setStage("upload");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [stage, fetchJobStatus, determineStage]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleUploadSuccess = useCallback(async () => {
    const job = await fetchJobStatus();
    await determineStage(job);
  }, [fetchJobStatus, determineStage]);

  const handleAllConfirmed = useCallback(async () => {
    // Register generation was triggered — reload registers and transition
    try {
      const regs = await getRegisters(project.id);
      if (regs.length > 0) {
        const latestReg = regs[0];
        const regRows = await getRegisterRows(project.id, latestReg.id);
        setRegister(latestReg);
        setRows(regRows);
        setStage("register");
      }
    } catch {
      /* Silently fail — user can still see relationship screen */
    }
  }, [project.id]);

  const handleUploadNew = useCallback(() => {
    setStage("upload");
    setJobState(null);
    setRelationships([]);
    setRegister(null);
    setRows([]);
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Pipeline stage indicator */}
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900">AI Register Automation</h2>
          <span className="text-slate-400">—</span>
          <span className="text-sm font-medium text-blue-600 capitalize">{stage}</span>
        </div>
        {/* Step breadcrumb */}
        <div className="flex items-center gap-1.5 mt-2">
          {(["upload", "processing", "relationships", "register"] as Stage[]).map(
            (s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <div className="h-px w-5 bg-slate-200 shrink-0" />}
                <span
                  className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full transition-colors ${
                    stage === s
                      ? "bg-blue-600 text-white"
                      : ["upload", "processing", "relationships", "register"].indexOf(s) <
                        ["upload", "processing", "relationships", "register"].indexOf(stage)
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {s}
                </span>
              </React.Fragment>
            )
          )}
        </div>
      </div>

      <div className="p-6">
        {stage === "upload" && (
          <UploadZIP
            project={project}
            onUploadSuccess={handleUploadSuccess}
            lastJob={jobState}
          />
        )}
        {stage === "processing" && jobState && (
          <ProcessingStatus jobState={jobState} />
        )}
        {stage === "relationships" && (
          <RelationshipConfirmation
            projectId={project.id}
            relationships={relationships}
            onAllConfirmed={handleAllConfirmed}
          />
        )}
        {stage === "register" && register && (
          <RegisterReview
            register={register}
            rows={rows}
            onUploadNew={handleUploadNew}
          />
        )}
      </div>
    </div>
  );
}
