export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  orgId: string;
  type?: 'access' | 'refresh';
}
