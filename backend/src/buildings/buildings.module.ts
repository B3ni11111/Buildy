import { Module } from '@nestjs/common';
import { BuildingsController } from './buildings.controller.js';
import { BuildingsService } from './buildings.service.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [UsersModule],
  controllers: [BuildingsController],
  providers: [BuildingsService],
  exports: [BuildingsService],
})
export class BuildingsModule {}
