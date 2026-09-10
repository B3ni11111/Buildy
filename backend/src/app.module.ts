import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { BuildingsModule } from './buildings/buildings.module.js';
import { IssuesModule } from './issues/issues.module.js';
import { CognitoAuthGuard } from './auth/cognito-auth.guard.js';

@Module({
  imports: [PrismaModule, UsersModule, BuildingsModule, IssuesModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: CognitoAuthGuard }],
})
export class AppModule {}
