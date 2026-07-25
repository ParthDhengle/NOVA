import { apiClient } from "./client";
import type {
  UserProfile,
  UpdateProfileRequest,
} from "@/lib/types/profile";

export const profileApi = {
  getProfile() {
    return apiClient.get<UserProfile>("/profile");
  },

  updateProfile(data: UpdateProfileRequest) {
    return apiClient.put<void>("/profile", data);
  },
};