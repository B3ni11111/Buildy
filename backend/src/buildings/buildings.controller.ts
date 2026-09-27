import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { BuildingsService } from './buildings.service.js';
import { JoinBuildingDto } from './dto/join-building.dto.js';
import { UpdateMembershipDto } from './dto/update-membership.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.type.js';

@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  list() {
    return this.buildingsService.list();
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.buildingsService.me(user);
  }

  @Get(':buildingId/members')
  members(@CurrentUser() user: AuthUser, @Param('buildingId', ParseUUIDPipe) buildingId: string) {
    return this.buildingsService.members(user.cognitoSub, buildingId);
  }

  @Patch('me/membership')
  updateMembership(@CurrentUser() user: AuthUser, @Body() dto: UpdateMembershipDto) {
    return this.buildingsService.updateMembership(user, dto);
  }

  @Post('join')
  join(@CurrentUser() user: AuthUser, @Body() dto: JoinBuildingDto) {
    return this.buildingsService.join(user, dto);
  }

  @Post('leave')
  leave(@CurrentUser() user: AuthUser) {
    return this.buildingsService.leave(user);
  }
}
