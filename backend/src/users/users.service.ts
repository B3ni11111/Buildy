import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto.js';
import type { AuthUser } from '../auth/auth-user.type.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findOrCreate(authUser: AuthUser) {
    return this.prisma.user.upsert({
      where: { cognitoSub: authUser.cognitoSub },
      update: {},
      create: {
        cognitoSub: authUser.cognitoSub,
        email: authUser.email,
        name: authUser.name,
      },
    });
  }

  updateOnboarding(authUser: AuthUser, dto: UpdateOnboardingDto) {
    return this.prisma.user.upsert({
      where: { cognitoSub: authUser.cognitoSub },
      update: {
        name: dto.name,
        language: dto.language,
        userType: dto.userType,
        onboardedAt: new Date(),
      },
      create: {
        cognitoSub: authUser.cognitoSub,
        email: authUser.email,
        name: dto.name,
        language: dto.language,
        userType: dto.userType,
        onboardedAt: new Date(),
      },
    });
  }
}
