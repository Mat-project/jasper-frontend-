import apiClient from "./client";

export const getProjectCommercialSummary = async (projectId: string) => {
  const response = await apiClient.get(`/api/v1/commercial/projects/${projectId}/commercial-summary/`);
  return response.data;
};

// Purchase Orders
export const getPurchaseOrders = async (projectId: string) => {
  const response = await apiClient.get("/api/v1/commercial/purchase-orders/", { params: { project: projectId } });
  const data = response.data || {};
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
};

export const createPurchaseOrder = async (data: any) => {
  const response = await apiClient.post("/api/v1/commercial/purchase-orders/", data);
  return response.data;
};

// Invoices
export const getInvoices = async (projectId: string) => {
  const response = await apiClient.get("/api/v1/commercial/invoices/", { params: { project: projectId } });
  const data = response.data || {};
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
};

export const createDraftInvoice = async (data: any) => {
  const response = await apiClient.post("/api/v1/commercial/invoices/", data);
  return response.data;
};

export const submitInvoice = async (id: string) => {
  const response = await apiClient.post(`/api/v1/commercial/invoices/${id}/submit/`);
  return response.data;
};

export const approveInvoice = async (id: string) => {
  const response = await apiClient.post(`/api/v1/commercial/invoices/${id}/approve/`);
  return response.data;
};

export const sendInvoice = async (id: string) => {
  const response = await apiClient.post(`/api/v1/commercial/invoices/${id}/send_invoice/`);
  return response.data;
};

export const cancelInvoice = async (id: string, reason: string) => {
  const response = await apiClient.post(`/api/v1/commercial/invoices/${id}/cancel/`, { reason });
  return response.data;
};

// Download Invoice PDF
export const downloadInvoicePdf = async (id: string, invoiceNumber: string) => {
  const response = await apiClient.get(`/api/v1/commercial/invoices/${id}/pdf/`, {
    responseType: "blob",
  });
  
  // Create a blob link to download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${invoiceNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
};

// Payments
export const getPayments = async (invoiceId: string) => {
  const response = await apiClient.get("/api/v1/commercial/payments/", { params: { invoice: invoiceId } });
  const data = response.data || {};
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
};

export const recordPayment = async (data: any) => {
  const response = await apiClient.post("/api/v1/commercial/payments/", data);
  return response.data;
};
