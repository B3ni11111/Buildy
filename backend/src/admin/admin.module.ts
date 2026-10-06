import { Module } from '@nestjs/common';
import { AdminBuildingsController } from './admin-buildings.controller.js';
import { AdminBuildingsService } from './admin-buildings.service.js';
import { CitiesController } from '../cities/cities.controller.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { DocsModule } from '../docs/docs.module.js';

@Module({
  imports: [DocsModule],
  controllers: [AdminBuildingsController, CitiesController],
  providers: [AdminBuildingsService, AdminGuard],
})
export class AdminModule {}
