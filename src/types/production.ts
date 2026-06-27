export interface ProductionEntry {
  id: string;
  date: string;
  employee_id: string;
  project_id: string;
  drawing_category_id: string;
  quantity: number;
  tonnage: number;
  remarks: string;
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
}
