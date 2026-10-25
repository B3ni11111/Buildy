import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { BuildingsService } from './buildings.service.js';
import { PreviewUsersDto } from './dto/manage.dto.js';
import { CreateMyBuildingDto } from '../admin/dto/building.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.type.js';

@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.buildingsService.mine(user);
  }

  /** Any signed-in user can create a building; they become its committee head or management company. */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMyBuildingDto) {
    const { role, ...building } = dto;
    return this.buildingsService.createAsMember(user, building, role);
  }

  /** Names and pictures for pasted user IDs (before adding them as residents). */
  @Post('preview-users')
  @HttpCode(200)
  previewUsers(@CurrentUser() user: AuthUser, @Body() dto: PreviewUsersDto) {
    return this.buildingsService.previewUsers(user, dto.ids, dto.buildingId);
  }

  @Post(':buildingId/leave')
  leave(@CurrentUser() user: AuthUser, @Param('buildingId', ParseUUIDPipe) buildingId: string) {
    return this.buildingsService.leave(user, buildingId);
  }

  @Get(':buildingId/members')
  members(@CurrentUser() user: AuthUser, @Param('buildingId', ParseUUIDPipe) buildingId: string) {
    return this.buildingsService.members(user.cognitoSub, buildingId);
  }
}
