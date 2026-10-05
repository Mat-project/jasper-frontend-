import apiClient from "./client";

export const getSystemSettings = async () => {
  const response = await apiClient.get("/api/v1/settings/config/");
  return response.data;
};

export const updateSystemSetting = async (key: string, value: any) => {
  const response = await apiClient.patch(`/api/v1/settings/config/${key}/`, { value });
  return response.data;
};

export const createSystemSetting = async (key: string, value: any) => {
  const response = await apiClient.post("/api/v1/settings/config/", { key, value });
  return response.data;
};

export const uploadCompanyFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  // Do not set Content-Type header manually for FormData in Axios
  const response = await apiClient.post("/api/v1/settings/config/upload_company_file/", formData);
  return response.data;
};

export interface GmailAuthStatus {
  connected: boolean;
  email: string;
  connected_at: string | null;
  scope: string | null;
}

export const getGmailAuthStatus = async (): Promise<GmailAuthStatus> => {
  const response = await apiClient.get("/api/v1/email/google/status/");
  return response.data;
};

export const getGmailConnectUrl = async (): Promise<{ auth_url: string; state: string }> => {
  const response = await apiClient.get("/api/v1/email/google/connect/?json=true");
  return response.data;
};

export const sendGmailVerificationTest = async (payload?: { to?: string; subject?: string; body?: string }) => {
  const response = await apiClient.post("/api/v1/email/google/test-send/", payload || {});
  return response.data;
};

