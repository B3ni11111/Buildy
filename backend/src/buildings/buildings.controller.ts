import { Body, Controller, Get, Post } from '@nestjs/common';
import { BuildingsService } from './buildings.service.js';
import { JoinBuildingDto } from './dto/join-building.dto.js';
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

  @Post('join')
  join(@CurrentUser() user: AuthUser, @Body() dto: JoinBuildingDto) {
    return this.buildingsService.join(user, dto);
  }

  @Post('leave')
  leave(@CurrentUser() user: AuthUser) {
    return this.buildingsService.leave(user);
  }
}
