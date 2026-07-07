import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';

import { USER_ROLES } from 'src/modules/user/constants/user.constant';
import { User, UserDocument } from 'src/modules/user/user.schema';

import { AUTH_ERRORS } from '../constants/auth.response';
import { AuthenticatedRequest } from '../types/request';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<USER_ROLES[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userData = await this.userModel.findById(user?.id);

    if (!userData) {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }

    return requiredRoles.some((role) => userData.role === role);
  }
}
