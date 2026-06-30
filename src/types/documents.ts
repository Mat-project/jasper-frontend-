export interface Document {
  id: string;
  project_id: string;
  document_type: string;
  version: string;
  file_name: string;
  file_size?: string;
  remarks: string;
  uploaded_by: string;
  uploaded_at: string;
  status: "Pending" | "Approved" | "Rejected";
  approved_by?: string;
  approved_at?: string;
  remarks_approver?: string;
}

export interface VersionHistory {
  id: string;
  document_id: string;
  version: string;
  file_name: string;
  remarks: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface RevisionRecord {
  id: string;
  project_id: string;
  drawing_number: string;
  revision_type: "Internal Revision" | "Client Revision";
  description: string;
  date: string;
  is_billable: boolean;
  created_at: string;
}
