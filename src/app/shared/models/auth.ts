export interface AuthResponse {
  id: number;
  username: string;
  email: string;
  authorities: string[];
  token: string;
  profile: UserProfile | null;
  refreshToken: string;
}

/**
 * Shape of GET /api/auth/v1/details and PUT /api/auth/v1/update-user. `profile` is null only for an
 * account that has no profile row yet; the avatar URL it carries is relative, so the profile module
 * (UserService.getProfile) is still the place to read the absolute minio URL from.
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
