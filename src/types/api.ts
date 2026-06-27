/**
 * Shared TypeScript types for API responses.
 */

/** Standard paginated list response from the backend. */
export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Standard error envelope from the backend. */
export interface APIError {
  error: {
    code: string;
    message: string;
    details: Record<string, string[]>;
  };
  status: number;
}

/** JWT token pair response. */
export interface TokenResponse {
  access: string;
  refresh: string;
}

/** Standard success message response. */
export interface MessageResponse {
  message: string;
}
