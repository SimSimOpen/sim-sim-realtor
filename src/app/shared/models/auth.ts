export interface AuthResponse {
  id: number;
  username: string;
  email: string;
  authorities: string[];
  token: string;
  profile: UserProfile;
  refreshToken: string;
}

/**
 * Shape of GET /api/auth/v1/details and PUT /api/auth/v1/update-user. The auth mapper never fills
 * `profile`, so it always arrives null — the profile module is the source of profile data.
 */
export interface UserDetailsResponse {
  id: number;
  username: string;
  email: string;
  roles: string[];
  profile: UserProfile | null;
}

export interface UserProfile {
  id: number;
  userId: number;
  profileId: number;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserData {
  username: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  description: string;
}
