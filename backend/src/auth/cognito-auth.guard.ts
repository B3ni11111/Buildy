import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { IS_PUBLIC_KEY } from './public.decorator.js';

@Injectable()
export class CognitoAuthGuard implements CanActivate {
  private readonly verifier: ReturnType<typeof CognitoJwtVerifier.create>;

  constructor(private readonly reflector: Reflector) {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;
    if (!userPoolId || !clientId) {
      throw new Error('COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID must be set to verify Cognito tokens');
    }
    this.verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id',
      clientId,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.verifier.verify(authHeader.slice('Bearer '.length));
      request.user = {
        cognitoSub: payload.sub,
        email: payload.email as string | undefined,
        name: payload.name as string | undefined,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
