import apiClient from "./client";

interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProductionEntry {
  id: string;
  employee: string;
  employee_name: string;
  project_id: string;
  project_code: string;
  project_name: string;
  drawing_category_id: string;
  drawing_category_code: string;
  drawing_category_name: string;
  date: string;
  quantity: number;
  tonnage: number;
  remarks: string;
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
  approved_by: string | null;
  approved_by_name: string | null;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionEntryFormData {
  date: string;
  employee_id: string;
  project_id: string;
  drawing_category_id: string;
  quantity: number;
  tonnage: number;
  remarks: string;
  status?: string;
}

export async function getProductionEntries(params?: { status?: string; employee?: string; project?: string }): Promise<ProductionEntry[]> {
  const res = await apiClient.get<PaginatedResponse<ProductionEntry>>("/api/v1/production/entries/", {
    params: { page_size: 200, ...params },
  });
  return res.data.results;
}

export async function createProductionEntry(data: ProductionEntryFormData): Promise<ProductionEntry> {
  const res = await apiClient.post<ProductionEntry>("/api/v1/production/entries/", data);
  return res.data;
}

export async function approveProductionEntry(id: string): Promise<ProductionEntry> {
  const res = await apiClient.patch<ProductionEntry>(`/api/v1/production/entries/${id}/approve/`);
  return res.data;
}

export async function rejectProductionEntry(id: string, rejectionReason: string): Promise<ProductionEntry> {
  const res = await apiClient.patch<ProductionEntry>(`/api/v1/production/entries/${id}/reject/`, {
    rejection_reason: rejectionReason,
  });
  return res.data;
}
