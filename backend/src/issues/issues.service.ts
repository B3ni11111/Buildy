import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateIssueDto } from './dto/create-issue.dto.js';
import { UpdateIssueDto } from './dto/update-issue.dto.js';

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireMember(cognitoSub: string, buildingId: string) {
    const user = await this.prisma.user.findUnique({ where: { cognitoSub } });
    if (!user || user.currentBuildingId !== buildingId) {
      throw new ForbiddenException('Not a member of this building');
    }
    return user;
  }

  async list(cognitoSub: string, buildingId: string) {
    await this.requireMember(cognitoSub, buildingId);
    return this.prisma.issue.findMany({
      where: { buildingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(cognitoSub: string, buildingId: string, dto: CreateIssueDto) {
    const user = await this.requireMember(cognitoSub, buildingId);
    return this.prisma.issue.create({
      data: {
        buildingId,
        authorId: user.id,
        title: dto.title,
        description: dto.description,
      },
    });
  }

  private async requireAuthor(cognitoSub: string, issueId: string) {
    const issue = await this.prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new NotFoundException('Issue not found');
    const user = await this.prisma.user.findUnique({ where: { cognitoSub } });
    if (!user || issue.authorId !== user.id) {
      throw new ForbiddenException('Only the author can modify this issue');
    }
    return issue;
  }

  async update(cognitoSub: string, issueId: string, dto: UpdateIssueDto) {
    await this.requireAuthor(cognitoSub, issueId);
    return this.prisma.issue.update({ where: { id: issueId }, data: dto });
  }

  async remove(cognitoSub: string, issueId: string) {
    await this.requireAuthor(cognitoSub, issueId);
    await this.prisma.issue.delete({ where: { id: issueId } });
    return { ok: true };
  }
}
