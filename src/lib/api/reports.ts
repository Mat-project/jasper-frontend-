import apiClient from "./client";

export const getReport = async (reportType: string, params: Record<string, any> = {}) => {
  const response = await apiClient.get(`/api/v1/reports/${reportType}/`, { params });
  return response.data;
};

export const downloadReportCSV = async (reportType: string, params: Record<string, any> = {}) => {
  try {
    const response = await apiClient.get(`/api/v1/reports/${reportType}/`, {
      params: { ...params, export: "csv" },
      responseType: "blob",
    });
    
    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${reportType}_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download CSV", error);
  }
};
