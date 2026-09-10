import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
import { IssuesService } from './issues.service.js';
import { UpdateIssueDto } from './dto/update-issue.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.type.js';

@Controller('issues')
export class IssueDetailController {
  constructor(private readonly issuesService: IssuesService) {}

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateIssueDto) {
    return this.issuesService.update(user.cognitoSub, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.issuesService.remove(user.cognitoSub, id);
  }
}
