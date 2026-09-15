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

export interface WorkspaceContext {
  id: string;
  user: string;
  project: string;
  active_submission: string | null;
  submission_no: string | null;
  current_stage: "Relationship" | "Review" | "Transmittal" | "Revisions";
  newer_submission_available: boolean;
  latest_submission_id: string | null;
  latest_submission_no: string | null;
  updated_at: string;
}

export interface RegisterNotification {
  id: string;
  user: string;
  project: string;
  project_name?: string;
  project_code?: string;
  title: string;
  message: string;
  status: "Unread" | "Read";
  action_type: string;
  action_id: string;
  submission_id?: string | null;
  created_at: string;
}

// ─── Relationships ────────────────────────────────────────────────────────────

/** Fetch all proposed relationships for a project (follows pagination) */
export async function getRelationships(projectId: string): Promise<Relationship[]> {
  // Request a large page size to minimise round-trips, then follow
  // the `next` links until all pages are consumed.
  let url: string | null = `${BASE}/${projectId}/relationships/?page_size=100`;
  const all: Relationship[] = [];
  let pageCount = 0;
  const MAX_PAGES = 20; // safety limit

  while (url !== null && pageCount < MAX_PAGES) {
    pageCount++;
    const res: { data: any } = await apiClient.get<any>(url);
    const data = res.data;
    if (data && typeof data === 'object' && 'results' in data) {
      all.push(...(data.results as Relationship[]));
      // Extract just the path+query from the next URL to avoid
      // cross-origin issues (e.g. next URL has backend origin
      // but the browser might be accessing via a different host).
      const nextUrl = data.next as string | null;
      if (nextUrl) {
        try {
          const parsed = new URL(nextUrl);
          url = parsed.pathname + parsed.search;
        } catch {
          url = nextUrl;
        }
      } else {
        url = null;
      }
    } else if (Array.isArray(data)) {
      all.push(...(data as Relationship[]));
      url = null;
    } else {
      url = null;
    }
  }

  return all;
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

/** Download project register as Excel (J-456 NESBA format) */
export async function exportProjectRegister(
  projectId: string,
  registerId?: string
): Promise<Blob> {
  const params = registerId ? { register_id: registerId } : {};
  const res = await apiClient.get(
    `${BASE}/${projectId}/registers/export_excel/`,
    { params, responseType: "blob" }
  );
  return res.data as Blob;
}

/** Options for downloading the company-wide mail register as Excel */
export interface ExportMonthlyOptions {
  year?: number;
  month?: number;
  start_date?: string;
  end_date?: string;
}

/** Download monthly or date-filtered company-wide mail register as Excel (JASPER MAIL REGISTER format) */
export async function exportMonthlyRegister(
  yearOrOptions?: number | ExportMonthlyOptions,
  month?: number
): Promise<Blob> {
  const params: Record<string, any> = {};
  if (typeof yearOrOptions === "object" && yearOrOptions !== null) {
    if (yearOrOptions.start_date) params.start_date = yearOrOptions.start_date;
    if (yearOrOptions.end_date) params.end_date = yearOrOptions.end_date;
    if (yearOrOptions.year) params.year = yearOrOptions.year;
    if (yearOrOptions.month) params.month = yearOrOptions.month;
  } else if (typeof yearOrOptions === "number") {
    params.year = yearOrOptions;
    if (month !== undefined) params.month = month;
  }
  const res = await apiClient.get(
    `/api/v1/register_ai/registers/export_monthly/`,
    { params, responseType: "blob" }
  );
  return res.data as Blob;
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

/** Get workspace context for user in a project */
export async function getWorkspace(
  projectId: string
): Promise<WorkspaceContext> {
  const res = await apiClient.get<WorkspaceContext>(
    `${BASE}/${projectId}/workspace/`
  );
  return res.data;
}

/** Update workspace context (active submission, current stage) */
export async function updateWorkspace(
  projectId: string,
  data: {
    active_submission_id?: string | null;
    current_stage?: string;
  }
): Promise<WorkspaceContext> {
  const res = await apiClient.post<WorkspaceContext>(
    `${BASE}/${projectId}/workspace/`,
    data
  );
  return res.data;
}

/** Get notifications for a project */
export async function getProjectNotifications(
  projectId: string
): Promise<RegisterNotification[]> {
  const res = await apiClient.get<any>(
    `${BASE}/${projectId}/notifications/`
  );
  if (res.data && typeof res.data === 'object' && 'results' in res.data) {
    return res.data.results;
  }
  return Array.isArray(res.data) ? res.data : [];
}

/** Mark notification as read (project-scoped) */
export async function markNotificationRead(
  projectId: string,
  notificationId: string
): Promise<RegisterNotification> {
  const res = await apiClient.post<RegisterNotification>(
    `${BASE}/${projectId}/notifications/${notificationId}/mark-read/`
  );
  return res.data;
}

// ─── Global Notification Center (cross-project) ──────────────────────────────
// The register_ai notifications endpoint is mounted both at the project-scoped
// path (/api/v1/projects/<id>/notifications/) and the global path
// (/api/v1/register_ai/notifications/). The global path returns ALL of the
// current user's notifications across every project — this is what the
// Notification Center bell in the header consumes.

const NOTIF_BASE = "/api/v1/register_ai/notifications";

/** Fetch all notifications for the current user (optionally filtered by project) */
export async function getAllNotifications(
  params: Record<string, any> = {}
): Promise<RegisterNotification[]> {
  const res = await apiClient.get<any>(`${NOTIF_BASE}/`, { params });
  if (res.data && typeof res.data === 'object' && 'results' in res.data) {
    return res.data.results;
  }
  return Array.isArray(res.data) ? res.data : [];
}

/** Fetch unread notifications for the current user */
export async function getUnreadNotifications(
  params: Record<string, any> = {}
): Promise<RegisterNotification[]> {
  const res = await apiClient.get<any>(`${NOTIF_BASE}/unread/`, { params });
  if (res.data && typeof res.data === 'object' && 'results' in res.data) {
    return res.data.results;
  }
  return Array.isArray(res.data) ? res.data : [];
}

/** Get the unread notification count for the current user */
export async function getUnreadNotificationCount(): Promise<number> {
  const res = await apiClient.get<{ count: number }>(`${NOTIF_BASE}/count/`);
  return res.data.count;
}

/** Mark a single notification as read (global path) */
export async function markNotificationReadGlobal(
  notificationId: string
): Promise<RegisterNotification> {
  const res = await apiClient.post<RegisterNotification>(
    `${NOTIF_BASE}/${notificationId}/mark-read/`
  );
  return res.data;
}

/** Mark all of the user's notifications as read */
export async function markAllNotificationsRead(): Promise<{ status: string }> {
  const res = await apiClient.post<{ status: string }>(`${NOTIF_BASE}/mark-all-read/`);
  return res.data;
}

/** Soft-delete a notification */
export async function deleteNotification(
  notificationId: string
): Promise<void> {
  await apiClient.delete(`${NOTIF_BASE}/${notificationId}/`);
}
