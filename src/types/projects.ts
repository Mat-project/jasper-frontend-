export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  start_date: string;
  end_date: string;
  status: "Not Started" | "In Progress" | "On Hold" | "Completed";
  created_at: string;
}

export interface ProjectAssignment {
  id: string;
  project_id: string;
  employee_id: string;
  assigned_at: string;
}
