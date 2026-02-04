export interface AuthResponse {
  id: number;
  username: string;
  email: string;
  authorities: string[];
  token: string;
  refreshToken: string;
}
