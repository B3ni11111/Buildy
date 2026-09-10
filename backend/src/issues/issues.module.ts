import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller.js';
import { IssueDetailController } from './issue-detail.controller.js';
import { IssuesService } from './issues.service.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [UsersModule],
  controllers: [IssuesController, IssueDetailController],
  providers: [IssuesService],
})
export class IssuesModule {}
