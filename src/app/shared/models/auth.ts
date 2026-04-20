export interface AuthResponse {
  id: number;
  username: string;
  email: string;
  authorities: string[];
  token: string;
  profile: UserProfile;
  refreshToken: string;
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
