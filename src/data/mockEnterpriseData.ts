export interface EnterpriseEmployee {
  id: string;
  code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  avatar: string;
  designation: string;
  department: string;
  section: string;
  manager_name: string;
  join_date: string;
  is_active: boolean;
}

export interface EnterpriseProject {
  id: string;
  code: string;
  name: string;
  client: string;
  budget: number;
  spent: number;
  start_date: string;
  end_date: string;
  status: "Active" | "Planned" | "At Risk" | "Completed" | "On Hold";
  priority: "High" | "Low";
  progress: number;
  milestones: { id: string; name: string; due_date: string; is_completed: boolean }[];
  tasks: { total: number; completed: number; in_progress: number; pending: number };
}

export interface EnterpriseAssignment {
  id: string;
  project_id: string;
  employee_id: string;
  role: "Lead Engineer" | "BIM Specialist" | "Structural Detailer" | "Checker" | "Modeler";
  allocation_percentage: number;
  assigned_date: string;
}

export interface EnterpriseAttendance {
  id: string;
  date: string;
  employee_id: string;
  status: "Present" | "Absent" | "On Leave" | "Half Day" | "Work From Home";
  check_in: string;
  check_out: string;
  break_duration_mins: number;
  working_hours: number;
  overtime_hours: number;
  is_late: boolean;
  is_early_exit: boolean;
  remarks: string;
}

export interface EnterpriseLeaveRequest {
  id: string;
  employee_id: string;
  leave_type: "Casual Leave" | "Sick Leave" | "Earned Leave" | "Maternity" | "Unpaid";
  start_date: string;
  end_date: string;
  days_count: number;
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
  applied_at: string;
  approved_by?: string;
  rejection_reason?: string;
}

export interface EnterpriseLeaveBalance {
  employee_id: string;
  casual_total: number; casual_used: number;
  sick_total: number; sick_used: number;
  earned_total: number; earned_used: number;
  unpaid_used: number;
}

export interface EnterpriseSalaryStructure {
  employee_id: string;
  basic_salary: number;
  hra: number;
  conveyance_allowance: number;
  special_allowance: number;
  pf_deduction: number;
  esi_deduction: number;
  tds_tax_deduction: number;
  overtime_hourly_rate: number;
}

export interface EnterprisePayslip {
  id: string;
  employee_id: string;
  period: string; // e.g. "June 2026"
  gross_earnings: number;
  gross_deductions: number;
  net_salary: number;
  overtime_pay: number;
  bonus: number;
  status: "Paid" | "Processing" | "On Hold";
  paid_date: string;
}

// ── DATA SEED ──────────────────────────────────────────────────────────────────

export const ENTERPRISE_EMPLOYEES: EnterpriseEmployee[] = [
  {
    id: "emp-101",
    code: "EOMS-101",
    first_name: "Rajesh",
    last_name: "Sharma",
    email: "rajesh.sharma@eoms.in",
    phone: "+91 98765 43210",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    designation: "Principal Structural Engineer",
    department: "Civil & Structural",
    section: "Heavy Infrastructure",
    manager_name: "Self (VP Engineering)",
    join_date: "2020-03-15",
    is_active: true,
  },
  {
    id: "emp-102",
    code: "EOMS-102",
    first_name: "Priya",
    last_name: "Sundaram",
    email: "priya.sundaram@eoms.in",
    phone: "+91 98765 43211",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    designation: "Lead Checker & Quality Auditor",
    department: "Quality Assurance",
    section: "Drawing Audits",
    manager_name: "Rajesh Sharma",
    join_date: "2021-06-01",
    is_active: true,
  },
  {
    id: "emp-103",
    code: "EOMS-103",
    first_name: "Amit",
    last_name: "Verma",
    email: "amit.verma@eoms.in",
    phone: "+91 98765 43212",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    designation: "Senior Tekla Modeler",
    department: "Civil & Structural",
    section: "3D Steel Detailing",
    manager_name: "Rajesh Sharma",
    join_date: "2022-01-10",
    is_active: true,
  },
  {
    id: "emp-104",
    code: "EOMS-104",
    first_name: "Ananya",
    last_name: "Deshmukh",
    email: "ananya.deshmukh@eoms.in",
    phone: "+91 98765 43213",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    designation: "BIM Specialist (MEP)",
    department: "Mechanical & Electrical",
    section: "HVAC Modeling",
    manager_name: "Priya Sundaram",
    join_date: "2022-08-20",
    is_active: true,
  },
  {
    id: "emp-105",
    code: "EOMS-105",
    first_name: "Vikram",
    last_name: "Malhotra",
    email: "vikram.malhotra@eoms.in",
    phone: "+91 98765 43214",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    designation: "Revit Detailer",
    department: "Architectural",
    section: "Facade Detailing",
    manager_name: "Rajesh Sharma",
    join_date: "2023-02-01",
    is_active: true,
  },
];

export const ENTERPRISE_PROJECTS: EnterpriseProject[] = [
  {
    id: "prj-201",
    code: "PRJ-MUM-01",
    name: "Mumbai Metro Line 4 Steel Viaducts",
    client: "L&T Heavy Engineering",
    budget: 1250000,
    spent: 840000,
    start_date: "2026-01-15",
    end_date: "2026-11-30",
    status: "Active",
    priority: "High",
    progress: 68,
    milestones: [
      { id: "m-1", name: "Pier Cap Steel Detailing", due_date: "2026-03-31", is_completed: true },
      { id: "m-2", name: "Girder Fabrications Shop Drawings", due_date: "2026-06-30", is_completed: true },
      { id: "m-3", name: "Station Roof Truss Approval", due_date: "2026-08-15", is_completed: false },
    ],
    tasks: { total: 45, completed: 30, in_progress: 10, pending: 5 },
  },
  {
    id: "prj-202",
    code: "PRJ-BLR-04",
    name: "Bengaluru Tech Park Tower B (BIM)",
    client: "Tata Projects Ltd",
    budget: 850000,
    spent: 610000,
    start_date: "2026-02-01",
    end_date: "2026-09-30",
    status: "Active",
    priority: "High",
    progress: 72,
    milestones: [
      { id: "m-4", name: "MEP Clash Detection", due_date: "2026-04-15", is_completed: true },
      { id: "m-5", name: "As-Built HVAC Sheets", due_date: "2026-07-15", is_completed: false },
    ],
    tasks: { total: 28, completed: 20, in_progress: 5, pending: 3 },
  },
  {
    id: "prj-203",
    code: "PRJ-DEL-09",
    name: "Delhi Airport Terminal Expansion Girders",
    client: "Shapoorji Pallonji Co.",
    budget: 1500000,
    spent: 450000,
    start_date: "2026-04-01",
    end_date: "2027-03-31",
    status: "At Risk",
    priority: "High",
    progress: 30,
    milestones: [
      { id: "m-6", name: "Connection Detailing Approval", due_date: "2026-06-15", is_completed: false },
    ],
    tasks: { total: 60, completed: 18, in_progress: 12, pending: 30 },
  },
  {
    id: "prj-204",
    code: "PRJ-HYD-02",
    name: "Hyderabad Pharma City Warehouse Truss",
    client: "Reliance Infrastructure",
    budget: 420000,
    spent: 410000,
    start_date: "2026-01-01",
    end_date: "2026-05-31",
    status: "Completed",
    priority: "Low",
    progress: 100,
    milestones: [
      { id: "m-7", name: "Final Fabrication Release", due_date: "2026-05-20", is_completed: true },
    ],
    tasks: { total: 15, completed: 15, in_progress: 0, pending: 0 },
  },
];

export const ENTERPRISE_ASSIGNMENTS: EnterpriseAssignment[] = [
  { id: "asg-1", project_id: "prj-201", employee_id: "emp-101", role: "Lead Engineer", allocation_percentage: 50, assigned_date: "2026-01-15" },
  { id: "asg-2", project_id: "prj-201", employee_id: "emp-103", role: "Structural Detailer", allocation_percentage: 75, assigned_date: "2026-01-15" },
  { id: "asg-3", project_id: "prj-201", employee_id: "emp-102", role: "Checker", allocation_percentage: 40, assigned_date: "2026-02-01" },
  { id: "asg-4", project_id: "prj-202", employee_id: "emp-104", role: "BIM Specialist", allocation_percentage: 80, assigned_date: "2026-02-01" },
  { id: "asg-5", project_id: "prj-203", employee_id: "emp-103", role: "Structural Detailer", allocation_percentage: 45, assigned_date: "2026-04-01" }, // Overallocated 75+45 = 120%!
  { id: "asg-6", project_id: "prj-203", employee_id: "emp-105", role: "Modeler", allocation_percentage: 60, assigned_date: "2026-04-01" },
];

export const ENTERPRISE_ATTENDANCE: EnterpriseAttendance[] = [
  { id: "att-1", date: "2026-06-26", employee_id: "emp-101", status: "Present", check_in: "08:52 AM", check_out: "05:18 PM", break_duration_mins: 45, working_hours: 7.7, overtime_hours: 0, is_late: false, is_early_exit: false, remarks: "Regular shift" },
  { id: "att-2", date: "2026-06-26", employee_id: "emp-102", status: "Present", check_in: "09:22 AM", check_out: "07:30 PM", break_duration_mins: 60, working_hours: 9.1, overtime_hours: 1.5, is_late: true, is_early_exit: false, remarks: "Late check-in due to traffic, extended shift" },
  { id: "att-3", date: "2026-06-26", employee_id: "emp-103", status: "Work From Home", check_in: "09:00 AM", check_out: "06:00 PM", break_duration_mins: 60, working_hours: 8.0, overtime_hours: 0, is_late: false, is_early_exit: false, remarks: "Approved remote detailing day" },
  { id: "att-4", date: "2026-06-26", employee_id: "emp-104", status: "On Leave", check_in: "--", check_out: "--", break_duration_mins: 0, working_hours: 0, overtime_hours: 0, is_late: false, is_early_exit: false, remarks: "Approved Sick Leave" },
  { id: "att-5", date: "2026-06-26", employee_id: "emp-105", status: "Present", check_in: "08:45 AM", check_out: "04:30 PM", break_duration_mins: 30, working_hours: 7.2, overtime_hours: 0, is_late: false, is_early_exit: true, remarks: "Early exit for doctor appointment" },
];

export const ENTERPRISE_LEAVES: EnterpriseLeaveRequest[] = [
  { id: "lv-1", employee_id: "emp-104", leave_type: "Sick Leave", start_date: "2026-06-26", end_date: "2026-06-27", days_count: 2, status: "Approved", reason: "Viral fever and doctor advice to rest", applied_at: "2026-06-25", approved_by: "Priya Sundaram" },
  { id: "lv-2", employee_id: "emp-103", leave_type: "Casual Leave", start_date: "2026-07-02", end_date: "2026-07-03", days_count: 2, status: "Pending", reason: "Family event in hometown", applied_at: "2026-06-27" },
  { id: "lv-3", employee_id: "emp-105", leave_type: "Earned Leave", start_date: "2026-07-10", end_date: "2026-07-15", days_count: 6, status: "Pending", reason: "Annual vacation trip", applied_at: "2026-06-28" },
];

export const ENTERPRISE_LEAVE_BALANCES: Record<string, EnterpriseLeaveBalance> = {
  "emp-101": { employee_id: "emp-101", casual_total: 12, casual_used: 2, sick_total: 10, sick_used: 0, earned_total: 15, earned_used: 3, unpaid_used: 0 },
  "emp-102": { employee_id: "emp-102", casual_total: 12, casual_used: 4, sick_total: 10, sick_used: 1, earned_total: 15, earned_used: 0, unpaid_used: 0 },
  "emp-103": { employee_id: "emp-103", casual_total: 12, casual_used: 5, sick_total: 10, sick_used: 2, earned_total: 15, earned_used: 4, unpaid_used: 0 },
  "emp-104": { employee_id: "emp-104", casual_total: 12, casual_used: 1, sick_total: 10, sick_used: 4, earned_total: 15, earned_used: 0, unpaid_used: 0 },
  "emp-105": { employee_id: "emp-105", casual_total: 12, casual_used: 3, sick_total: 10, sick_used: 0, earned_total: 15, earned_used: 2, unpaid_used: 0 },
};

export const ENTERPRISE_SALARIES: Record<string, EnterpriseSalaryStructure> = {
  "emp-101": { employee_id: "emp-101", basic_salary: 85000, hra: 34000, conveyance_allowance: 4000, special_allowance: 22000, pf_deduction: 10200, esi_deduction: 0, tds_tax_deduction: 18500, overtime_hourly_rate: 600 },
  "emp-102": { employee_id: "emp-102", basic_salary: 65000, hra: 26000, conveyance_allowance: 3000, special_allowance: 16000, pf_deduction: 7800, esi_deduction: 0, tds_tax_deduction: 12000, overtime_hourly_rate: 450 },
  "emp-103": { employee_id: "emp-103", basic_salary: 50000, hra: 20000, conveyance_allowance: 2500, special_allowance: 12500, pf_deduction: 6000, esi_deduction: 0, tds_tax_deduction: 7500, overtime_hourly_rate: 350 },
  "emp-104": { employee_id: "emp-104", basic_salary: 48000, hra: 19200, conveyance_allowance: 2500, special_allowance: 11300, pf_deduction: 5760, esi_deduction: 0, tds_tax_deduction: 6800, overtime_hourly_rate: 320 },
  "emp-105": { employee_id: "emp-105", basic_salary: 42000, hra: 16800, conveyance_allowance: 2000, special_allowance: 9200, pf_deduction: 5040, esi_deduction: 0, tds_tax_deduction: 5200, overtime_hourly_rate: 280 },
};

export const ENTERPRISE_PAYSLIPS: EnterprisePayslip[] = [
  { id: "ps-101", employee_id: "emp-101", period: "June 2026", gross_earnings: 145000, gross_deductions: 28700, net_salary: 116300, overtime_pay: 0, bonus: 10000, status: "Paid", paid_date: "2026-06-30" },
  { id: "ps-102", employee_id: "emp-102", period: "June 2026", gross_earnings: 112700, gross_deductions: 19800, net_salary: 92900, overtime_pay: 2700, bonus: 0, status: "Paid", paid_date: "2026-06-30" },
  { id: "ps-103", employee_id: "emp-103", period: "June 2026", gross_earnings: 85000, gross_deductions: 13500, net_salary: 71500, overtime_pay: 0, bonus: 0, status: "Paid", paid_date: "2026-06-30" },
  { id: "ps-104", employee_id: "emp-104", period: "June 2026", gross_earnings: 81000, gross_deductions: 12560, net_salary: 68440, overtime_pay: 0, bonus: 0, status: "Paid", paid_date: "2026-06-30" },
  { id: "ps-105", employee_id: "emp-105", period: "June 2026", gross_earnings: 70000, gross_deductions: 10240, net_salary: 59760, overtime_pay: 0, bonus: 0, status: "Paid", paid_date: "2026-06-30" },
];
