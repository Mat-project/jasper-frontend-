import apiClient from "./client";
import type { Department, DrawingCategory, Role, Section } from "@/types/masters";

interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

async function fetchAll<T>(url: string): Promise<T[]> {
  const res = await apiClient.get<PaginatedResponse<T>>(url, {
    params: { page_size: 100 },
  });
  return res.data.results;
}

// ── Departments ───────────────────────────────────────────────────────────────

export async function getDepartments(): Promise<Department[]> {
  return fetchAll<Department>("/api/v1/masters/departments/");
}

export async function createDepartment(code: string, name: string): Promise<Department> {
  const res = await apiClient.post<Department>("/api/v1/masters/departments/", { code, name });
  return res.data;
}

export async function updateDepartment(id: string, code: string, name: string): Promise<Department> {
  const res = await apiClient.patch<Department>(`/api/v1/masters/departments/${id}/`, { code, name });
  return res.data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/masters/departments/${id}/`);
}

// ── Sections ──────────────────────────────────────────────────────────────────

export async function getSections(): Promise<Section[]> {
  return fetchAll<Section>("/api/v1/masters/sections/");
}

export async function createSection(code: string, name: string): Promise<Section> {
  const res = await apiClient.post<Section>("/api/v1/masters/sections/", { code, name });
  return res.data;
}

export async function updateSection(id: string, code: string, name: string): Promise<Section> {
  const res = await apiClient.patch<Section>(`/api/v1/masters/sections/${id}/`, { code, name });
  return res.data;
}

export async function deleteSection(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/masters/sections/${id}/`);
}

// ── Drawing Categories ────────────────────────────────────────────────────────

export async function getDrawingCategories(): Promise<DrawingCategory[]> {
  return fetchAll<DrawingCategory>("/api/v1/masters/drawing-categories/");
}

export async function createDrawingCategory(code: string, name: string): Promise<DrawingCategory> {
  const res = await apiClient.post<DrawingCategory>("/api/v1/masters/drawing-categories/", { code, name });
  return res.data;
}

export async function updateDrawingCategory(id: string, code: string, name: string): Promise<DrawingCategory> {
  const res = await apiClient.patch<DrawingCategory>(`/api/v1/masters/drawing-categories/${id}/`, { code, name });
  return res.data;
}

export async function deleteDrawingCategory(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/masters/drawing-categories/${id}/`);
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export async function getRoles(): Promise<Role[]> {
  return fetchAll<Role>("/api/v1/masters/roles/");
}

export async function createRole(code: string, name: string): Promise<Role> {
  const res = await apiClient.post<Role>("/api/v1/masters/roles/", { code, name });
  return res.data;
}

export async function updateRole(id: string, code: string, name: string): Promise<Role> {
  const res = await apiClient.patch<Role>(`/api/v1/masters/roles/${id}/`, { code, name });
  return res.data;
}

export async function deleteRole(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/masters/roles/${id}/`);
}
