/**
 * register_ai.ts
 * API helpers for the Register AI Automation pipeline.
 * Covers: Relationships, Registers, Register Generation.
 */
import apiClient from "./client";

const BASE = "/api/v1/projects";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DrawingFileMeta {
  id: string;
  drawing_metadata: {
    id: string;
    drawing_number: string | null;
    revision: string | null;
    title: string | null;
    ai_confidence_score: string | null;
  };
}

export interface BBSFileMeta {
  id: string;
  bbs_metadata: {
    id: string;
    bbs_number: string | null;
    revision: string | null;
    weight: string | null;
    ai_confidence_score: string | null;
  };
}

export interface Relationship {
  id: string;
  project: string;
  confidence_score: string;
  status: "Proposed" | "Confirmed" | "Rejected";
  drawing_files: DrawingFileMeta[];
  bbs_files: BBSFileMeta[];
  reviewed_at: string | null;
}

export interface RegisterRow {
  id: string;
  drawing_number: string;
  drawing_rev: string | null;
  bbs_numbers: string | null;
  bbs_revs: string | null;
  total_weight: string | null;
  remarks: string | null;
  validation_exceptions: { rule_name: string; severity: string; message: string }[];
}

export interface Register {
  id: string;
  version_number: number;
  status: "Draft" | "Active" | "Superseded";
  generated_at: string;
  validation_report: {
    id: string;
    status: "Passed" | "Failed" | "Overridden";
    exceptions: { id: string; rule_name: string; severity: string; message: string }[];
  } | null;
}

export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Relationships ────────────────────────────────────────────────────────────

/** Fetch all proposed relationships for a project */
export async function getRelationships(projectId: string): Promise<Relationship[]> {
  const res = await apiClient.get<PaginatedResponse<Relationship>>(
    `${BASE}/${projectId}/relationships/`
  );
  return res.data.results;
}

/** Confirm a single relationship */
export async function confirmRelationship(
  projectId: string,
  relationshipId: string
): Promise<Relationship> {
  const res = await apiClient.patch<Relationship>(
    `${BASE}/${projectId}/relationships/${relationshipId}/confirm/`
  );
  return res.data;
}

/** Reject a single relationship */
export async function rejectRelationship(
  projectId: string,
  relationshipId: string
): Promise<Relationship> {
  const res = await apiClient.patch<Relationship>(
    `${BASE}/${projectId}/relationships/${relationshipId}/reject/`
  );
  return res.data;
}

// ─── Register Generation ──────────────────────────────────────────────────────

/** Trigger register generation after all relationships are confirmed */
export async function generateRegister(projectId: string): Promise<Register> {
  const res = await apiClient.post<Register>(
    `${BASE}/${projectId}/registers/generate/`
  );
  return res.data;
}

// ─── Registers ────────────────────────────────────────────────────────────────

/** Fetch all register versions for a project */
export async function getRegisters(projectId: string): Promise<Register[]> {
  const res = await apiClient.get<PaginatedResponse<Register>>(
    `${BASE}/${projectId}/registers/`
  );
  return res.data.results;
}

/** Fetch register rows for a specific register ID */
export async function getRegisterRows(
  projectId: string,
  registerId: string
): Promise<RegisterRow[]> {
  const res = await apiClient.get<PaginatedResponse<RegisterRow>>(
    `${BASE}/${projectId}/registers/${registerId}/rows/`
  );
  return res.data.results;
}
