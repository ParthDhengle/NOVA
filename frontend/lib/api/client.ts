import { getAuth } from "firebase/auth";

export const API_BASE_URL = "http://127.0.0.1:8001";

class ApiClient {
  constructor(private readonly baseURL: string) {}

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const auth = getAuth();

    let idToken: string | undefined;

    if (auth.currentUser) {
      idToken = await auth.currentUser.getIdToken();
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(idToken && {
          Authorization: `Bearer ${idToken}`,
        }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await auth.signOut();
        throw new Error("Authentication failed. Please login again.");
      }

      const error = await response.json().catch(() => ({}));

      throw new Error(
        error.detail || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  get<T>(
    url: string,
    params?: Record<string, string | number | boolean>
  ) {
    let finalUrl = url;

    if (params) {
      const search = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        search.append(key, String(value));
      });

      finalUrl += `?${search.toString()}`;
    }

    return this.request<T>(finalUrl, {
      method: "GET",
    });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);