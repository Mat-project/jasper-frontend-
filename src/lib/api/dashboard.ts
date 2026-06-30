import apiClient from "./client";

export const getAdminDashboard = async () => {
  const response = await apiClient.get("/api/v1/dashboard/admin/");
  return response.data;
};

export const getManagerDashboard = async () => {
  const response = await apiClient.get("/api/v1/dashboard/manager/");
  return response.data;
};

export const getEmployeeDashboard = async () => {
  const response = await apiClient.get("/api/v1/dashboard/employee/");
  return response.data;
};
