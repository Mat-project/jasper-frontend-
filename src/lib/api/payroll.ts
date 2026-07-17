import apiClient from "./client";

export interface EnterpriseSalaryStructure {
  id: string;
  employee_id: string;
  basic_salary: number;
  hra: number;
  special_allowance: number;
  conveyance_allowance: number;
  pf_deduction: number;
  esi_deduction: number;
  tds_tax_deduction: number;
  overtime_hourly_rate: number;
  drawing_submission_rate?: number;
  drawing_checking_rate?: number;
}

export interface EnterprisePayslip {
  id: string;
  employee_id: string;
  period: string;
  gross_earnings: number;
  gross_deductions: number;
  net_salary: number;
  overtime_pay: number;
  bonus: number;
  status: "Processing" | "Paid" | "Failed";
  paid_date: string | null;
}

interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function getSalaryStructures(): Promise<EnterpriseSalaryStructure[]> {
  const res = await apiClient.get<PaginatedResponse<EnterpriseSalaryStructure>>("/api/v1/payroll/structures/", {
    params: { page_size: 100 },
  });
  return res.data.results;
}

export async function createSalaryStructure(data: Partial<EnterpriseSalaryStructure>): Promise<EnterpriseSalaryStructure> {
  const res = await apiClient.post<EnterpriseSalaryStructure>("/api/v1/payroll/structures/", data);
  return res.data;
}

export async function updateSalaryStructure(id: string, data: Partial<EnterpriseSalaryStructure>): Promise<EnterpriseSalaryStructure> {
  const res = await apiClient.patch<EnterpriseSalaryStructure>(`/api/v1/payroll/structures/${id}/`, data);
  return res.data;
}

export async function getPayslips(): Promise<EnterprisePayslip[]> {
  const res = await apiClient.get<PaginatedResponse<EnterprisePayslip>>("/api/v1/payroll/payslips/", {
    params: { page_size: 100 },
  });
  return res.data.results;
}

export async function generatePayslips(period: string): Promise<EnterprisePayslip[]> {
  const res = await apiClient.post<EnterprisePayslip[]>("/api/v1/payroll/payslips/generate/", { period });
  return res.data;
}
