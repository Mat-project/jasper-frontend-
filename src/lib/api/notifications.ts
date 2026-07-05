import apiClient from "./client";

export interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  type: string;
  module: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  referenceId: string | null;
  userId: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedNotifications {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: NotificationResponse[];
}

export async function getNotifications(params: Record<string, any> = {}): Promise<PaginatedNotifications> {
  const res = await apiClient.get<PaginatedNotifications>("/api/v1/notifications/", { params });
  return res.data;
}

export async function getUnreadNotifications(params: Record<string, any> = {}): Promise<PaginatedNotifications> {
  const res = await apiClient.get<PaginatedNotifications>("/api/v1/notifications/unread/", { params });
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get<{ count: number }>("/api/v1/notifications/count/");
  return res.data.count;
}

export async function markAsRead(id: string): Promise<NotificationResponse> {
  const res = await apiClient.patch<NotificationResponse>(`/api/v1/notifications/read/${id}/`);
  return res.data;
}

export async function markAllAsRead(): Promise<{ status: string; message: string }> {
  const res = await apiClient.patch<{ status: string; message: string }>("/api/v1/notifications/read-all/");
  return res.data;
}

export async function createNotification(data: Partial<NotificationResponse>): Promise<NotificationResponse> {
  const res = await apiClient.post<NotificationResponse>("/api/v1/notifications/", data);
  return res.data;
}
