export interface Milestone {
  id: string;
  name: string;
  due_date: string;
  is_completed: boolean;
}

export interface TaskSummary {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  start_date: string;
  end_date: string;
  status: "Planned" | "Active" | "On Hold" | "Completed" | "Cancelled";
  priority: "Low" | "Medium" | "High" | "Critical";
  progress: number; // 0 to 100
  budget: number;
  milestones: Milestone[];
  tasks: TaskSummary;
  created_at: string;
}

export interface ProjectAssignment {
  id: string;
  project_id: string;
  employee_id: string;
  role?: string;
  allocation_percentage?: number; // 0 to 100
  assigned_date?: string;
}
