import { Module } from '@nestjs/common';
import { DocDetailController, DocsController } from './docs.controller.js';
import { DocsService } from './docs.service.js';
import { BuildingsModule } from '../buildings/buildings.module.js';

@Module({
  imports: [BuildingsModule],
  controllers: [DocsController, DocDetailController],
  providers: [DocsService],
})
export class DocsModule {}
