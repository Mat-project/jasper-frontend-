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
