import { Module } from '@nestjs/common';
import { IssueAttachmentsController, IssueDetailController, IssuesController } from './issues.controller.js';
import { IssuesService } from './issues.service.js';
import { BuildingsModule } from '../buildings/buildings.module.js';

@Module({
  imports: [BuildingsModule],
  controllers: [IssuesController, IssueDetailController, IssueAttachmentsController],
  providers: [IssuesService],
})
export class IssuesModule {}
