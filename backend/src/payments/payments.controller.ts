import { Body, Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { ChangeFeeDto, MarkPaidDto, PaymentSettingsDto, SetPayerDto } from './payments.dto.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.type.js';

/** Building management: the month's budget, who paid, the setup and the building-wide log. */
@Controller('buildings/:buildingId/manage/payments')
export class PaymentsManageController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  overview(@CurrentUser() user: AuthUser, @Param('buildingId', ParseUUIDPipe) buildingId: string) {
    return this.paymentsService.overview(user.cognitoSub, buildingId);
  }

  @Put('settings')
  saveSettings(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Body() dto: PaymentSettingsDto,
  ) {
    return this.paymentsService.saveSettings(user.cognitoSub, buildingId, dto);
  }

  @Get('log')
  log(@CurrentUser() user: AuthUser, @Param('buildingId', ParseUUIDPipe) buildingId: string) {
    return this.paymentsService.buildingLog(user.cognitoSub, buildingId);
  }

  @Post('open')
  openMonth(@CurrentUser() user: AuthUser, @Param('buildingId', ParseUUIDPipe) buildingId: string) {
    return this.paymentsService.openMonth(user.cognitoSub, buildingId);
  }

  @Post('mark-all-paid')
  markAllPaid(@CurrentUser() user: AuthUser, @Param('buildingId', ParseUUIDPipe) buildingId: string) {
    return this.paymentsService.markAllPaid(user.cognitoSub, buildingId);
  }

  @Post(':apartmentId/paid')
  markPaid(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Param('apartmentId', ParseIntPipe) apartmentId: number,
    @Body() dto: MarkPaidDto,
  ) {
    return this.paymentsService.markPaid(user.cognitoSub, buildingId, apartmentId, dto.method);
  }

  @Patch(':apartmentId/fee')
  changeFee(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Param('apartmentId', ParseIntPipe) apartmentId: number,
    @Body() dto: ChangeFeeDto,
  ) {
    return this.paymentsService.changeFee(user.cognitoSub, buildingId, apartmentId, dto.amount, dto.scope);
  }
}

/** A resident's own part: their apartments, who pays them, the demo Pay and each apartment's log. */
@Controller('buildings/:buildingId/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('mine')
  mine(@CurrentUser() user: AuthUser, @Param('buildingId', ParseUUIDPipe) buildingId: string) {
    return this.paymentsService.mine(user.cognitoSub, buildingId);
  }

  @Get(':apartmentId/log')
  apartmentLog(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Param('apartmentId', ParseIntPipe) apartmentId: number,
  ) {
    return this.paymentsService.apartmentLog(user.cognitoSub, buildingId, apartmentId);
  }

  /** Owners only: who pays this apartment's fee. */
  @Put(':apartmentId/payer')
  setPayer(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Param('apartmentId', ParseIntPipe) apartmentId: number,
    @Body() dto: SetPayerDto,
  ) {
    return this.paymentsService.setPayer(user.cognitoSub, buildingId, apartmentId, dto.userId);
  }

  /** Demo only: counts as paid instantly. Only the apartment's payer. */
  @Post(':apartmentId/pay')
  pay(
    @CurrentUser() user: AuthUser,
    @Param('buildingId', ParseUUIDPipe) buildingId: string,
    @Param('apartmentId', ParseIntPipe) apartmentId: number,
  ) {
    return this.paymentsService.pay(user.cognitoSub, buildingId, apartmentId);
  }
}
