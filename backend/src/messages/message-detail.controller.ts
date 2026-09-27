import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { UpdateMessageDto } from './dto/update-message.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.type.js';

@Controller('messages')
export class MessageDetailController {
  constructor(private readonly messagesService: MessagesService) {}

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMessageDto) {
    return this.messagesService.update(user.cognitoSub, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.messagesService.remove(user.cognitoSub, id);
  }
}
