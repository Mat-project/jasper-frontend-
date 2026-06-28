import apiClient from "./client";
import type { User } from "@/types/user";

interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface EmployeeFormData {
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department: string;
  section: string;
  role: string;
}

export async function getEmployees(): Promise<User[]> {
  const res = await apiClient.get<PaginatedResponse<User>>("/api/v1/employees/", {
    params: { page_size: 100 },
  });
  return res.data.results;
}

export async function createEmployee(data: EmployeeFormData): Promise<User> {
  const res = await apiClient.post<User>("/api/v1/employees/", data);
  return res.data;
}

export async function updateEmployee(userId: string, data: EmployeeFormData): Promise<User> {
  const res = await apiClient.patch<User>(`/api/v1/employees/${userId}/`, data);
  return res.data;
}

export async function toggleEmployeeStatus(userId: string): Promise<User> {
  const res = await apiClient.post<User>(`/api/v1/employees/${userId}/toggle-status/`);
  return res.data;
}
