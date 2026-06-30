import apiClient from "./client";

export const getReport = async (reportType: string, params: Record<string, any> = {}) => {
  const response = await apiClient.get(`/api/v1/reports/${reportType}/`, { params });
  return response.data;
};

export const downloadReportCSV = (reportType: string, params: Record<string, any> = {}) => {
  const queryParams = new URLSearchParams({ ...params, export: "csv" }).toString();
  const token = apiClient.defaults.headers.common["Authorization"] || "";
  const url = `${apiClient.defaults.baseURL}/api/v1/reports/${reportType}/?${queryParams}`;
  
  // Trigger direct browser download
  window.open(url, "_blank");
};
