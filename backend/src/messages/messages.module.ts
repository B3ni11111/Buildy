import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller.js';
import { MessageDetailController } from './message-detail.controller.js';
import { MessagesService } from './messages.service.js';
import { BuildingsModule } from '../buildings/buildings.module.js';

@Module({
  imports: [BuildingsModule],
  controllers: [MessagesController, MessageDetailController],
  providers: [MessagesService],
})
export class MessagesModule {}
