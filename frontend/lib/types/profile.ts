export interface UserProfile {
  uid: string;
  email: string;

  Name?: string;
  displayName?: string;
  role?: string;
  location?: string;
  productiveTime?: string;
  topMotivation?: string;
  aiTone?: string;
  profileComplete: boolean;
}

export interface UpdateProfileRequest {
  displayName?: string;
  role?: string;
  location?: string;
  productiveTime?: string;
  topMotivation?: string;
  aiTone?: string;
}

export interface ProfileData {
  displayName?: string;
  role?: string;
  location?: string;
  productiveTime?: string;
  topMotivation?: string;
  aiTone?: string;
  [key: string]: string | undefined;
}