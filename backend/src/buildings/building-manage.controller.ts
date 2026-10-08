import { Body, Controller, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { BuildingsService } from './buildings.service.js';
import { SetApartmentsDto, UpdateBuildingDetailsDto } from './dto/manage.dto.js';
import { ContactLinkDto } from '../admin/dto/building.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.type.js';

/** Building management: committee head / management company of the building, or an admin (checked in the service). */
@Controller('buildings/:buildingId/manage')
export class BuildingManageController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Put('members/:userId/apartments')
  setApartments(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SetApartmentsDto,
  ) {
    return this.buildingsService.setApartments(user.cognitoSub, buildingId, userId, dto);
  }

  /** `?block=true` also blocks them from rejoining. */
  @Delete('members/:userId')
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('block', new ParseBoolPipe({ optional: true })) block?: boolean,
  ) {
    return this.buildingsService.removeMember(user.cognitoSub, buildingId, userId, !!block);
  }

  @Get('blocks')
  listBlocks(@CurrentUser() user: AuthUser, @Param('buildingId', ParseUUIDPipe) buildingId: string) {
    return this.buildingsService.listBlocks(user.cognitoSub, buildingId);
  }

  @Delete('blocks/:userId')
  unblock(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.buildingsService.unblock(user.cognitoSub, buildingId, userId);
  }

  @Patch('details')
  updateDetails(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Body() dto: UpdateBuildingDetailsDto,
  ) {
    return this.buildingsService.updateDetails(user.cognitoSub, buildingId, dto);
  }

  @Post('contact-links')
  addContactLink(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Body() dto: ContactLinkDto,
  ) {
    return this.buildingsService.addContactLink(user.cognitoSub, buildingId, dto);
  }

  @Delete('contact-links/:linkId')
  removeContactLink(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Param('linkId', ParseIntPipe) linkId: number,
  ) {
    return this.buildingsService.removeContactLink(user.cognitoSub, buildingId, linkId);
  }
}
