import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BuildingsService } from '../buildings/buildings.service.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { UpdateMessageDto } from './dto/update-message.dto.js';
import { effectiveAdmin } from '../auth/request-context.js';

const WITH_AUTHOR = { author: { select: { id: true, name: true } } } as const;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly buildingsService: BuildingsService,
  ) {}

  async list(cognitoSub: string, buildingId: string) {
    await this.buildingsService.requireMember(cognitoSub, buildingId);
    return this.prisma.message.findMany({
      where: { buildingId },
      orderBy: { uploadDate: 'desc' },
      include: WITH_AUTHOR,
    });
  }

  async create(cognitoSub: string, buildingId: string, dto: CreateMessageDto) {
    const user = await this.buildingsService.requireMember(cognitoSub, buildingId);
    return this.prisma.message.create({
      data: {
        buildingId,
        authorId: user.id,
        type: dto.type,
        title: dto.title,
        description: dto.description,
      },
      include: WITH_AUTHOR,
    });
  }

  private async requireAuthor(cognitoSub: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { author: { select: { cognitoSub: true } } },
    });
    if (!message) throw new NotFoundException('Message not found');
    // A former resident's message (author null) can only be changed by an admin.
    if (message.author?.cognitoSub !== cognitoSub) {
      const user = await this.prisma.user.findUnique({ where: { cognitoSub }, select: { isAdmin: true } });
      if (!effectiveAdmin(user)) throw new ForbiddenException('Only the author or an admin can modify this message');
    }
    return message;
  }

  async update(cognitoSub: string, messageId: string, dto: UpdateMessageDto) {
    await this.requireAuthor(cognitoSub, messageId);
    return this.prisma.message.update({ where: { id: messageId }, data: dto, include: WITH_AUTHOR });
  }

  async remove(cognitoSub: string, messageId: string) {
    await this.requireAuthor(cognitoSub, messageId);
    await this.prisma.message.delete({ where: { id: messageId } });
    return { ok: true };
  }
}
