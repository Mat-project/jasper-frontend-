import apiClient from "./client";

export const getAuditLogs = async (params: Record<string, any> = {}) => {
  const response = await apiClient.get("/api/v1/audit/logs/", { params });
  return response.data;
};
