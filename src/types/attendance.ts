export interface AttendanceRecord {
  id: string;
  date: string;
  employee_id: string;
  status: "Present" | "Absent" | "On Leave" | "Half Day";
  remarks: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: "Casual" | "Sick" | "Earned" | "Maternity/Paternity" | "LWP";
  start_date: string;
  end_date: string;
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
  applied_at: string;
  approved_by?: string;
  remarks?: string;
}
