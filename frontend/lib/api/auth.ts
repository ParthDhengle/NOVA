import { signInWithCustomToken, getAuth } from "firebase/auth";
import { apiClient } from "./client";
import type { ProfileData } from "@/lib/types/profile";
export interface AuthResponse {
  uid: string;
  custom_token: string;
  profile_complete: boolean;
}



export const authApi = {
  async login(email: string, password: string) {
    const response = await apiClient.post<AuthResponse>("/auth/login", {
      email,
      password,
    });

    await signInWithCustomToken(getAuth(), response.custom_token);

    return response;
  },

  async signup(email: string, password: string) {
    const response = await apiClient.post<AuthResponse>("/auth/signup", {
      email,
      password,
    });

    await signInWithCustomToken(getAuth(), response.custom_token);

    return response;
  },

  async logout() {
    await getAuth().signOut();
  },

  async completeProfile(profileData: ProfileData) {
    return apiClient.post<{
      success: boolean;
      profile_complete: boolean;
    }>("/profile/complete", profileData);
  },
};