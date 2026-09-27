import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AdminBuildingsService } from './admin-buildings.service.js';
import { ContactLinkDto, CreateBuildingDto, SetMemberRoleDto, UpdateBuildingDto } from './dto/building.dto.js';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminBuildingsController {
  constructor(private readonly adminBuildingsService: AdminBuildingsService) {}

  @Get('buildings')
  list() {
    return this.adminBuildingsService.list();
  }

  @Post('buildings')
  create(@Body() dto: CreateBuildingDto) {
    return this.adminBuildingsService.create(dto);
  }

  @Patch('buildings/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBuildingDto) {
    return this.adminBuildingsService.update(id, dto);
  }

  @Delete('buildings/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminBuildingsService.remove(id);
  }

  @Post('buildings/:id/contact-links')
  addContactLink(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ContactLinkDto) {
    return this.adminBuildingsService.addContactLink(id, dto);
  }

  @Delete('contact-links/:linkId')
  removeContactLink(@Param('linkId', ParseIntPipe) linkId: number) {
    return this.adminBuildingsService.removeContactLink(linkId);
  }

  @Put('buildings/:id/members/:userId/role')
  setMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SetMemberRoleDto,
  ) {
    return this.adminBuildingsService.setMemberRole(id, userId, dto.role);
  }

  @Delete('buildings/:id/members/:userId')
  removeMember(@Param('id', ParseUUIDPipe) id: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.adminBuildingsService.removeMember(id, userId);
  }
}
