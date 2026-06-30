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
