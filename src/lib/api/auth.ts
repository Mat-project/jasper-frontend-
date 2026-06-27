/**
 * Authentication API functions.
 */
import apiClient, { clearTokens, setTokens } from "./client";
import type { LoginCredentials, LoginResponse, User } from "@/types/user";
import type { MessageResponse } from "@/types/api";

/**
 * Login with email and password.
 * Stores tokens in cookies automatically.
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/api/v1/auth/login/",
    credentials
  );
  const { access, refresh } = response.data;
  setTokens(access, refresh);
  return response.data;
}

/**
 * Logout — blacklist the refresh token and clear local state.
 */
export async function logout(refreshToken: string): Promise<void> {
  try {
    await apiClient.post<MessageResponse>("/api/v1/auth/logout/", {
      refresh: refreshToken,
    });
  } finally {
    clearTokens();
  }
}

/**
 * Get the currently authenticated user's profile.
 */
export async function getMe(): Promise<User> {
  const response = await apiClient.get<User>("/api/v1/auth/me/");
  return response.data;
}

/**
 * Update the current user's profile.
 */
export async function updateMe(data: Partial<User>): Promise<User> {
  const response = await apiClient.patch<User>("/api/v1/auth/me/", data);
  return response.data;
}

/**
 * Change the current user's password.
 */
export async function changePassword(data: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>(
    "/api/v1/auth/change-password/",
    data
  );
  return response.data;
}
