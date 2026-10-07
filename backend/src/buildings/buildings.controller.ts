import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { BuildingsService } from './buildings.service.js';
import { JoinBuildingDto } from './dto/join-building.dto.js';
import { MyRequestDto } from './dto/manage.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.type.js';

@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  list() {
    return this.buildingsService.list();
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.buildingsService.mine(user);
  }

  @Post('join')
  join(@CurrentUser() user: AuthUser, @Body() dto: JoinBuildingDto) {
    return this.buildingsService.join(user, dto);
  }

  @Put(':buildingId/my-request')
  setMyRequest(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Body() dto: MyRequestDto,
  ) {
    return this.buildingsService.setMyRequest(user, buildingId, dto);
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
