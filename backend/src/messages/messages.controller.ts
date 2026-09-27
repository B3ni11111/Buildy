import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.type.js';

@Controller('buildings/:buildingId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('buildingId', ParseUUIDPipe) buildingId: string) {
    return this.messagesService.list(user.cognitoSub, buildingId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.create(user.cognitoSub, buildingId, dto);
  }
}
