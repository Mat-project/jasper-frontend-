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
  drawing_title: string | null;
  drawing_rev: string | null;
  bbs_numbers: string | null;
  bbs_revs: string | null;
  total_weight: string | null;
  sheet_no: string | null;
  date?: string | null;
  drawn_by: string | null;
  checked_by: string | null;
  section: string | null;
  mail_no: string | null;
  remarks: string | null;
  zip_package?: string | null;
  dynamic_fields?: Record<string, any>;
  validation_status?: string;
  validation_exceptions?: { rule_name: string; severity: string; message: string }[];
}

export interface Register {
  id: string;
  version_number: number;
  status: "Draft" | "Active" | "Superseded";
  generated_at: string;
  created_by?: { first_name?: string };
  validation_report: {
    id: string;
    status: "Passed" | "Failed" | "Overridden";
    exceptions: { id: string; rule_name: string; severity: string; message: string; drawing_number?: string | null }[];
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
  const res = await apiClient.get<any>(
    `${BASE}/${projectId}/relationships/`
  );
  if (res.data && typeof res.data === 'object' && 'results' in res.data) {
    return res.data.results;
  }
  return Array.isArray(res.data) ? res.data : [];
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
export async function generateRegister(projectId: string, zipPackageId?: string): Promise<Register> {
  const res = await apiClient.post<Register>(
    `${BASE}/${projectId}/registers/generate/`,
    zipPackageId ? { zip_package_id: zipPackageId } : {}
  );
  return res.data;
}

// ─── Registers ────────────────────────────────────────────────────────────────

export async function getRegisters(projectId: string): Promise<Register[]> {
  const res = await apiClient.get<any>(
    `${BASE}/${projectId}/registers/`
  );
  if (res.data && typeof res.data === 'object' && 'results' in res.data) {
    return res.data.results;
  }
  return Array.isArray(res.data) ? res.data : [];
}

/** Fetch register rows for a specific register ID */
export async function getRegisterRows(
  projectId: string,
  registerId: string
): Promise<RegisterRow[]> {
  const res = await apiClient.get<any>(
    `${BASE}/${projectId}/registers/${registerId}/rows/`
  );
  if (res.data && typeof res.data === 'object' && 'results' in res.data) {
    return res.data.results;
  }
  return Array.isArray(res.data) ? res.data : [];
}

/** Fetch version comparison data */
export async function getVersionComparison(
  projectId: string,
  fromVersion: number,
  toVersion: number
): Promise<any> {
  const res = await apiClient.get<any>(
    `/api/v1/projects/${projectId}/version-comparison/`,
    {
      params: {
        from_version: fromVersion,
        to_version: toVersion,
      }
    }
  );
  return res.data;
}

/** Bulk save (update, create, delete) register rows */
export async function bulkSaveRegisterRows(
  projectId: string,
  registerId: string,
  data: {
    upsert_rows: Partial<RegisterRow>[];
    delete_row_ids: string[];
  }
): Promise<any> {
  const res = await apiClient.post<any>(
    `${BASE}/${projectId}/registers/${registerId}/rows/bulk-save/`,
    data
  );
  return res.data;
}
