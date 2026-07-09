import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import {
  Injectable,
  ExecutionContext,
  HttpStatus,
  CanActivate,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { SerializeHttpResponse } from 'src/utils/serializer';
import { NOT_ALLOWED_USERS } from 'src/modules/user/constants/user.constant';
import { User, UserDocument } from 'src/modules/user/user.schema';

import { AUTH_ERRORS } from '../constants/auth.response';
import { AuthenticatedRequest } from '../types/request';
import { USER_ROLES } from '../constants/user-roles';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // @ts-expect-error - TODO: fix this
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;

    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      const token = authorizationHeader.substring(7);
      const tokenPayload = jwt.decode(token) as jwt.JwtPayload;

      const timestamp = Math.floor(Date.now() / 1000);

      if (!tokenPayload.exp || timestamp > tokenPayload?.exp) {
        return SerializeHttpResponse(
          null,
          HttpStatus.UNAUTHORIZED,
          AUTH_ERRORS.UNAUTHORIZED,
        );
      }

      const userId = tokenPayload?.sub;
      const user = await this.userModel.findById(userId);

      request['user'] = {
        id: tokenPayload.sub ?? '',
        email: (tokenPayload.email ?? '') as string,
        role: user?.role as USER_ROLES,
      };

      if (!user) {
        return SerializeHttpResponse(
          null,
          HttpStatus.UNAUTHORIZED,
          AUTH_ERRORS.UNAUTHORIZED,
        );
      }

      if (NOT_ALLOWED_USERS.includes(user.status)) {
        return SerializeHttpResponse(
          null,
          HttpStatus.UNAUTHORIZED,
          AUTH_ERRORS.UNAUTHORIZED,
        );
      }

      return true;
    }

    return SerializeHttpResponse(
      null,
      HttpStatus.UNAUTHORIZED,
      AUTH_ERRORS.UNAUTHORIZED,
    );
  }
}
