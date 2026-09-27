import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from './auth-user.type.js';

/**
 * Allows the request only for users with the global `is_admin` flag.
 * Runs after CognitoAuthGuard (global), so `request.user` is already verified.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authUser: AuthUser | undefined = context.switchToHttp().getRequest().user;
    if (!authUser) throw new ForbiddenException('Admins only');
    const user = await this.prisma.user.findUnique({
      where: { cognitoSub: authUser.cognitoSub },
      select: { isAdmin: true },
    });
    if (!user?.isAdmin) throw new ForbiddenException('Admins only');
    return true;
  }
}
