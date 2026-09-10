import { Body, Controller, Get, Put } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.type.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  findOrCreate(@CurrentUser() user: AuthUser) {
    return this.usersService.findOrCreate(user);
  }

  @Put('me/onboarding')
  updateOnboarding(@CurrentUser() user: AuthUser, @Body() dto: UpdateOnboardingDto) {
    return this.usersService.updateOnboarding(user, dto);
  }
}
