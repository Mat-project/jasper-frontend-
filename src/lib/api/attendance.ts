import apiClient from "./client";
import type { EnterpriseAttendance, EnterpriseLeaveRequest } from "@/data/mockEnterpriseData";

interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function getAttendance(params: Record<string, any> = {}): Promise<EnterpriseAttendance[]> {
  const res = await apiClient.get<PaginatedResponse<EnterpriseAttendance>>("/api/v1/attendance/records/", {
    params: { page_size: 100, ...params },
  });
  return res.data.results;
}

export async function createAttendance(data: Partial<EnterpriseAttendance>): Promise<EnterpriseAttendance> {
  const res = await apiClient.post<EnterpriseAttendance>("/api/v1/attendance/records/", data);
  return res.data;
}

export async function bulkSaveAttendance(date: string, records: any[]): Promise<any> {
  const res = await apiClient.post("/api/v1/attendance/records/bulk_save/", {
    date,
    records,
  });
  return res.data;
}

export async function getLeaves(): Promise<EnterpriseLeaveRequest[]> {
  const res = await apiClient.get<PaginatedResponse<EnterpriseLeaveRequest>>("/api/v1/attendance/leaves/", {
    params: { page_size: 100 },
  });
  return res.data.results;
}

export async function createLeave(data: Partial<EnterpriseLeaveRequest>): Promise<EnterpriseLeaveRequest> {
  const res = await apiClient.post<EnterpriseLeaveRequest>("/api/v1/attendance/leaves/", data);
  return res.data;
}

export async function approveLeave(id: string): Promise<EnterpriseLeaveRequest> {
  const res = await apiClient.post<EnterpriseLeaveRequest>(`/api/v1/attendance/leaves/${id}/approve/`);
  return res.data;
}

export async function rejectLeave(id: string, reason: string): Promise<EnterpriseLeaveRequest> {
  const res = await apiClient.post<EnterpriseLeaveRequest>(`/api/v1/attendance/leaves/${id}/reject/`, {
    rejection_reason: reason,
  });
  return res.data;
}
