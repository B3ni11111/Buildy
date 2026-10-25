import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MAX_AVATAR_BYTES, UsersService, toCurrentUser } from './users.service.js';
import { UpdateOnboardingDto, UpdateProfileDto } from './dto/update-onboarding.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.type.js';
import type { UploadedFileData } from '../uploads/uploads.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return toCurrentUser(await this.usersService.findOrCreate(user));
  }

  @Put('me/onboarding')
  async updateOnboarding(@CurrentUser() user: AuthUser, @Body() dto: UpdateOnboardingDto) {
    return toCurrentUser(await this.usersService.updateOnboarding(user, dto));
  }

  /** Private info only (name, phone) — apartments/roles are set by building management. */
  @Patch('me')
  async updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return toCurrentUser(await this.usersService.updateProfile(user, dto));
  }

  @Put('me/avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_AVATAR_BYTES, files: 1 } }))
  async setAvatar(@CurrentUser() user: AuthUser, @UploadedFile() file: UploadedFileData | undefined) {
    return toCurrentUser(await this.usersService.setAvatar(user, file));
  }

  @Delete('me/avatar')
  async removeAvatar(@CurrentUser() user: AuthUser) {
    return toCurrentUser(await this.usersService.removeAvatar(user));
  }

  @Delete('me')
  deleteAccount(@CurrentUser() user: AuthUser) {
    return this.usersService.deleteAccount(user);
  }

  @Get(':id/avatar')
  avatar(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.avatarFile(user, id);
  }
}
