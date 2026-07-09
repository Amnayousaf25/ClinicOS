export type Role = 'admin' | 'staff';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  orgId: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface InviteValidateResponse {
  email: string;
  name: string;
}
