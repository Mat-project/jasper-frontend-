export interface AttendanceRecord {
  id: string;
  date: string;
  employee_id: string;
  status: "Present" | "Absent" | "On Leave" | "Half Day" | "Work From Home";
  check_in?: string; // e.g. "08:45"
  check_out?: string; // e.g. "17:15"
  is_late?: boolean;
  is_early_exit?: boolean;
  working_hours?: number;
  remarks: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: "Casual" | "Sick" | "Earned" | "Maternity" | "Paternity" | "Unpaid";
  start_date: string;
  end_date: string;
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
  applied_at: string;
  approved_by?: string;
  remarks?: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type: LeaveRequest["leave_type"];
  total_days: number;
  used_days: number;
  remaining_days: number;
}
