import apiClient from "./client";

export interface AIUsageSummary {
  total_requests: number;
  success_requests: number;
  quota_exceeded_requests: number;
  error_requests: number;
  success_rate: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  total_cost_inr: number;
  active_model: string;
}

export interface AIUsageLogItem {
  id: string;
  created_at: string;
  file_name: string;
  submission_no?: string;
  project_code?: string;
  model_name: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_inr: number;
  status: "SUCCESS" | "QUOTA_EXCEEDED" | "ERROR";
  error_message?: string;
  latency_ms: number;
}

export interface AIUsageStatsResponse {
  summary: AIUsageSummary;
  logs: AIUsageLogItem[];
}

export async function getAIUsageStats(): Promise<AIUsageStatsResponse> {
  const response = await apiClient.get<AIUsageStatsResponse>("/api/v1/register-ai/ai-usage/");
  return response.data;
}
