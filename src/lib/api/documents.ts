import apiClient from "./client";
import { Document, VersionHistory, RevisionRecord } from "@/types/documents";

interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Document API Endpoints ─────────────────────────────────────────────────

export async function getDocuments(): Promise<Document[]> {
  const response = await apiClient.get<PaginatedResponse<Document>>("/api/v1/documents/documents/", {
    params: { page_size: 100 },
  });
  return response.data.results;
}

export async function createDocument(data: FormData): Promise<Document> {
  const response = await apiClient.post<Document>("/api/v1/documents/documents/", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function uploadVersion(id: string, data: FormData): Promise<Document> {
  const response = await apiClient.post<Document>(
    `/api/v1/documents/documents/${id}/upload_version/`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function downloadDocument(id: string): Promise<void> {
  const response = await apiClient.get(`/api/v1/documents/documents/${id}/download/`, {
    responseType: "blob",
  });
  
  // Extract filename or default
  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `document-${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function getVersions(documentId: string): Promise<VersionHistory[]> {
  const response = await apiClient.get<PaginatedResponse<VersionHistory>>("/api/v1/documents/versions/", {
    params: { page_size: 100 },
  });
  return response.data.results.filter((v: any) => v.document_id === documentId);
}

// ── Document Approval Workflow ──────────────────────────────────────────────

export async function approveDocument(id: string, comments: string = "Approved"): Promise<any> {
  const response = await apiClient.post(`/api/v1/documents/documents/${id}/approve/`, {
    comments,
  });
  return response.data;
}

export async function rejectDocument(id: string, comments: string): Promise<any> {
  const response = await apiClient.post(`/api/v1/documents/documents/${id}/reject/`, {
    comments,
  });
  return response.data;
}

// ── Revision Management ──────────────────────────────────────────────────────

export async function getRevisionHistory(): Promise<RevisionRecord[]> {
  const response = await apiClient.get<PaginatedResponse<RevisionRecord>>("/api/v1/documents/revisions/", {
    params: { page_size: 100 },
  });
  return response.data.results;
}

export async function createRevision(data: any): Promise<RevisionRecord> {
  // The backend expect document, document_version, revision_number, revision_reason, requested_by, etc.
  // We can fetch documents first to find the linked document and current version
  const docs = await getDocuments();
  const doc = docs.find((d) => d.id === data.project_id || d.project_id === data.project_id);
  
  // Find latest version
  const versionsResponse = await apiClient.get<PaginatedResponse<any>>("/api/v1/documents/versions/", {
    params: { page_size: 100 },
  });
  const latestVer = versionsResponse.data.results.find((v) => v.document_id === (doc?.id || data.project_id));

  const payload = {
    document: doc?.id || data.project_id,
    document_version: latestVer?.id || null,
    revision_number: 1,
    revision_reason: data.description,
    effective_date: data.date,
  };

  const response = await apiClient.post<RevisionRecord>("/api/v1/documents/revisions/", payload);
  
  // Generate billing charge if marked as billable
  if (data.is_billable) {
    await generateRevisionCharge({
      revision: response.data.id,
      charge_amount: "5000.00",
      currency: "INR",
      charge_reason: "Design correction surcharge",
    });
  }

  return response.data;
}

// ── Revision Charges & Billing ────────────────────────────────────────────────

export async function generateRevisionCharge(data: {
  revision: string;
  charge_amount: string;
  currency: string;
  charge_reason: string;
}): Promise<any> {
  const response = await apiClient.post("/api/v1/documents/charges/", {
    ...data,
    payment_status: "Pending",
  });
  return response.data;
}

export async function markChargePaid(id: string, invoiceReference: string = "INV-PAID"): Promise<any> {
  const response = await apiClient.post(`/api/v1/documents/charges/${id}/pay/`, {
    invoice_reference: invoiceReference,
  });
  return response.data;
}
