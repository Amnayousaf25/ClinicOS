import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator that extracts the orgId from the authenticated user.
 * Returns the raw ObjectId from the user document so Mongoose queries match.
 */
export const OrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.orgId;
  },
);
