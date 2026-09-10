import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IssuesService } from './issues.service.js';
import { CreateIssueDto } from './dto/create-issue.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.type.js';

@Controller('buildings/:buildingId/issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('buildingId') buildingId: string) {
    return this.issuesService.list(user.cognitoSub, buildingId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param('buildingId') buildingId: string,
    @Body() dto: CreateIssueDto,
  ) {
    return this.issuesService.create(user.cognitoSub, buildingId, dto);
  }
}
