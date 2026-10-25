import { Module } from '@nestjs/common';
import { PaymentsController, PaymentsManageController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { BuildingsModule } from '../buildings/buildings.module.js';

@Module({
  imports: [BuildingsModule],
  controllers: [PaymentsManageController, PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
