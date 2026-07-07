import { Request } from 'express';

import { USER_ROLES } from '../constants/user-roles';

export interface AuthenticatedPayload {
  id: string;
  email: string;
  role: USER_ROLES;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedPayload;
}
