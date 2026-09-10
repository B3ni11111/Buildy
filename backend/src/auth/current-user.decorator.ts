import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from './auth-user.type.js';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
