import { apiClient } from "./client";

export interface GoogleAuthStatus {
  connected: boolean;
  has_client_secret: boolean;
  has_tokens: boolean;
}

export interface ClientSecretRequest {
  client_id: string;
  client_secret: string;
}

export const googleAuthApi = {
  getStatus() {
    return apiClient.get<GoogleAuthStatus>(
      "/api/google-auth/status"
    );
  },

  uploadClientSecret(data: ClientSecretRequest) {
    return apiClient.post(
      "/api/google-auth/client-secret",
      data
    );
  },

  completeOAuth(code: string) {
    return apiClient.post(
      "/api/google-auth/complete",
      { code }
    );
  },
};