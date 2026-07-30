import apiClient from "./client";
import type { EnterpriseProject, EnterpriseAssignment } from "@/data/mockEnterpriseData";

interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function getProjects(): Promise<EnterpriseProject[]> {
  const res = await apiClient.get<PaginatedResponse<EnterpriseProject>>("/api/v1/projects/", {
    params: { page_size: 100 },
  });
  return res.data.results;
}

export async function createProject(data: Partial<EnterpriseProject>): Promise<EnterpriseProject> {
  const res = await apiClient.post<EnterpriseProject>("/api/v1/projects/", data);
  return res.data;
}

export async function updateProject(id: string, data: Partial<EnterpriseProject>): Promise<EnterpriseProject> {
  const res = await apiClient.patch<EnterpriseProject>(`/api/v1/projects/${id}/`, data);
  return res.data;
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/projects/${id}/`);
}

