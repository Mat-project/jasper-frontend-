export interface SalaryComponent {
  id: string;
  name: string;
  type: "Allowance" | "Deduction";
  value_type: "Percentage" | "Fixed";
  value: number;
}

export interface SalaryStructure {
  id: string;
  employee_id: string;
  basic_salary: number;
  allowances: { component_id: string; amount: number }[];
  deductions: { component_id: string; amount: number }[];
  overtime_rate_hourly: number;
  tax_rate_percentage: number;
  created_at: string;
}

export interface Payslip {
  id: string;
  employee_id: string;
  period: string; // e.g. "June 2026"
  basic_salary: number;
  gross_allowances: number;
  gross_deductions: number;
  overtime_hours: number;
  overtime_pay: number;
  bonus: number;
  tax_amount: number;
  net_salary: number;
  status: "Draft" | "Paid" | "On Hold";
  created_at: string;
}
