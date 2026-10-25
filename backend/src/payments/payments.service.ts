import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { BuildingPaymentSettings, PaymentMethod, Prisma, RelationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { BuildingsService } from '../buildings/buildings.service.js';
import type { FeeScope, PaymentSettingsDto } from './payments.dto.js';

/** Testing only: `PAYMENTS_PERIOD_MINUTES=5` (set in docker-compose.override.yml) makes a "month" last 5 minutes. */
const testPeriodMinutes = () => Number(process.env.PAYMENTS_PERIOD_MINUTES) || 0;

function israelDate(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** Start of the period containing `now`: the first day of the month in Israel (as UTC midnight), or the test slot. */
export function currentPeriod(now = new Date()): Date {
  const minutes = testPeriodMinutes();
  if (minutes > 0) {
    const ms = minutes * 60_000;
    return new Date(Math.floor(now.getTime() / ms) * ms);
  }
  const { year, month } = israelDate(now);
  return new Date(Date.UTC(year, month - 1, 1));
}

/** "YYYY-MM", or the full ISO time in test mode (so the app can show the slot's time). */
const monthKey = (period: Date) => (testPeriodMinutes() > 0 ? period.toISOString() : period.toISOString().slice(0, 7));

/** Pre-selected method when nobody chose one: the apartment's, else the building's, else card. */
const FALLBACK_METHOD: PaymentMethod = 'card';

const RESIDENTS_INCLUDE = {
  residents: { include: { user: { select: { id: true, name: true } } }, orderBy: { linkedAt: 'asc' } },
} satisfies Prisma.ApartmentInclude;
type ApartmentWithResidents = Prisma.ApartmentGetPayload<{ include: typeof RESIDENTS_INCLUDE }>;

/**
 * Who pays an apartment's fee: the resident an owner chose (while still linked to it), else the
 * first-linked owner, else the first-linked renter.
 */
function payerOf(apartment: ApartmentWithResidents | null): { id: string; name: string | null } | null {
  if (!apartment) return null;
  const chosen = apartment.residents.find((r) => r.userId === apartment.payerId);
  const owner = apartment.residents.find((r) => r.relationType === 'owner');
  return (chosen ?? owner ?? apartment.residents[0])?.user ?? null;
}

const LOG_INCLUDE = {
  paidBy: { select: { id: true, name: true } },
  confirmedBy: { select: { id: true, name: true } },
} satisfies Prisma.PaymentInclude;

function logRow(row: Prisma.PaymentGetPayload<{ include: typeof LOG_INCLUDE }>) {
  return {
    id: row.id,
    period: monthKey(row.period),
    apartmentNumber: row.apartmentNumber,
    amount: row.amount,
    status: row.status,
    paidAt: row.paidAt,
    paidBy: row.paidBy,
    confirmedBy: row.confirmedBy,
    confirmation: row.confirmation,
    method: row.method,
  };
}

/**
 * Monthly fees (demo). The standing fee lives on `apartments.monthly_payment` (or the building's
 * default fee); opening a month copies it into one `payments` row per apartment — a permanent log:
 * no undo, no partial payments. A month opens by management's click, or by itself on the
 * building's open day ("automatic": the first time anyone looks on or after it, no scheduler).
 * "Paying" is fake: it just marks the row paid. A real provider would replace `pay` and fill
 * `provider` / `external_ref` / `status` (`confirmation = automatic`).
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly buildingsService: BuildingsService,
  ) {}

  // ---- Setup and opening months ----

  private settings(buildingId: string) {
    return this.prisma.buildingPaymentSettings.findUnique({ where: { buildingId } });
  }

  /** Creates the missing charges of the current period (one per apartment). */
  private async createCharges(buildingId: string, settings: BuildingPaymentSettings | null) {
    const apartments = await this.prisma.apartment.findMany({ where: { buildingId } });
    await this.prisma.payment.createMany({
      data: apartments.map((a) => ({
        buildingId,
        apartmentId: a.id,
        apartmentNumber: a.number,
        period: currentPeriod(),
        amount: a.monthlyPayment ?? settings?.defaultFee ?? 0,
      })),
      skipDuplicates: true,
    });
  }

  /** Automatic mode: opens the month once its open day has come (right away in test mode). Adds new apartments too. */
  private async autoOpen(buildingId: string, settings: BuildingPaymentSettings | null) {
    if (settings?.openMode !== 'auto') return;
    if (!testPeriodMinutes() && israelDate(new Date()).day < settings.openDay) return;
    await this.createCharges(buildingId, settings);
  }

  /** Saves the building's payments setup (first time from the tile, or a later change). Applies to coming months. */
  async saveSettings(cognitoSub: string, buildingId: string, dto: PaymentSettingsDto) {
    await this.buildingsService.requireManager(cognitoSub, buildingId);
    const data = {
      openMode: dto.openMode,
      openDay: dto.openDay,
      defaultFee: dto.defaultFee ?? null,
      defaultMethod: dto.defaultMethod ?? null,
    };
    await this.prisma.buildingPaymentSettings.upsert({ where: { buildingId }, update: data, create: { buildingId, ...data } });
    return this.overview(cognitoSub, buildingId);
  }

  // ---- Building management ----

  /** The month's budget: every apartment with its charge, and collected / goal. */
  async overview(cognitoSub: string, buildingId: string) {
    await this.buildingsService.requireManager(cognitoSub, buildingId);
    const settings = await this.settings(buildingId);
    await this.autoOpen(buildingId, settings);
    return this.buildOverview(buildingId, settings);
  }

  /** Opens the current month by hand (also in automatic mode, before its day). Safe to repeat: adds only missing apartments. */
  async openMonth(cognitoSub: string, buildingId: string) {
    await this.buildingsService.requireManager(cognitoSub, buildingId);
    const settings = await this.settings(buildingId);
    await this.createCharges(buildingId, settings);
    return this.buildOverview(buildingId, settings);
  }

  /** Marks one apartment's charge for the current month paid (`single`). Final: there is no undo. */
  async markPaid(cognitoSub: string, buildingId: string, apartmentId: number, method?: PaymentMethod) {
    const manager = await this.buildingsService.requireManager(cognitoSub, buildingId);
    const settings = await this.settings(buildingId);
    const row = await this.prisma.payment.findFirst({
      where: { buildingId, apartmentId, period: currentPeriod() },
      include: { apartment: { include: RESIDENTS_INCLUDE } },
    });
    if (!row) throw new BadRequestException('Open this month first');
    if (row.status === 'unpaid') {
      await this.prisma.payment.updateMany({
        where: { id: row.id, status: 'unpaid' },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paidById: payerOf(row.apartment)?.id ?? null,
          confirmedById: manager.id,
          confirmation: 'single',
          method: method ?? row.apartment?.paymentMethod ?? settings?.defaultMethod ?? FALLBACK_METHOD,
        },
      });
    }
    return this.buildOverview(buildingId, settings);
  }

  /** "Mark all": every unpaid charge of the current month, each with its apartment's own method (`bulk`). */
  async markAllPaid(cognitoSub: string, buildingId: string) {
    const manager = await this.buildingsService.requireManager(cognitoSub, buildingId);
    const settings = await this.settings(buildingId);
    const period = currentPeriod();
    const rows = await this.prisma.payment.findMany({
      where: { buildingId, period, status: 'unpaid' },
      include: { apartment: { include: RESIDENTS_INCLUDE } },
    });
    if (rows.length === 0 && !(await this.prisma.payment.count({ where: { buildingId, period } }))) {
      throw new BadRequestException('Open this month first');
    }
    const paidAt = new Date();
    await this.prisma.$transaction(
      rows.map((row) =>
        this.prisma.payment.updateMany({
          where: { id: row.id, status: 'unpaid' },
          data: {
            status: 'paid',
            paidAt,
            paidById: payerOf(row.apartment)?.id ?? null,
            confirmedById: manager.id,
            confirmation: 'bulk',
            method: row.apartment?.paymentMethod ?? settings?.defaultMethod ?? FALLBACK_METHOD,
          },
        }),
      ),
    );
    return this.buildOverview(buildingId, settings);
  }

  /**
   * Changes an apartment's fee. `permanent` updates the standing fee (future months copy it) and
   * this month's charge if it is still unpaid; `once` changes only this month's unpaid charge.
   * A paid charge and past months never change.
   */
  async changeFee(cognitoSub: string, buildingId: string, apartmentId: number, amount: number, scope: FeeScope) {
    await this.buildingsService.requireManager(cognitoSub, buildingId);
    const apartment = await this.prisma.apartment.findFirst({ where: { id: apartmentId, buildingId } });
    if (!apartment) throw new NotFoundException('Apartment not found');
    const period = currentPeriod();
    const row = await this.prisma.payment.findFirst({ where: { buildingId, apartmentId, period } });

    if (scope === 'once') {
      if (!row) throw new BadRequestException('Open this month first');
      if (row.status !== 'unpaid') throw new ConflictException('This month is already paid');
    }

    await this.prisma.$transaction([
      ...(scope === 'permanent'
        ? [this.prisma.apartment.update({ where: { id: apartmentId }, data: { monthlyPayment: amount } })]
        : []),
      this.prisma.payment.updateMany({
        where: { buildingId, apartmentId, period, status: 'unpaid' },
        data: { amount },
      }),
    ]);
    return this.buildOverview(buildingId, await this.settings(buildingId));
  }

  /** Every payment in the building, newest month first (the log window filters it). */
  async buildingLog(cognitoSub: string, buildingId: string) {
    await this.buildingsService.requireManager(cognitoSub, buildingId);
    const rows = await this.prisma.payment.findMany({
      where: { buildingId },
      orderBy: [{ period: 'desc' }, { apartmentNumber: 'asc' }],
      include: LOG_INCLUDE,
      take: 2000,
    });
    return rows.map(logRow);
  }

  private async buildOverview(buildingId: string, settings: BuildingPaymentSettings | null) {
    const period = currentPeriod();
    const [apartments, rows] = await Promise.all([
      this.prisma.apartment.findMany({ where: { buildingId }, orderBy: { number: 'asc' }, include: RESIDENTS_INCLUDE }),
      this.prisma.payment.findMany({ where: { buildingId, period } }),
    ]);
    const byApartment = new Map(rows.map((r) => [r.apartmentId, r]));
    const goal = rows.reduce((sum, r) => sum + r.amount, 0);
    const collected = rows.filter((r) => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);
    const list = apartments.map((a) => {
      const row = byApartment.get(a.id);
      return {
        apartmentId: a.id,
        number: a.number,
        floor: a.floor,
        sqrm: a.sqrm,
        // The standing fee: its own, else the building's default.
        fee: a.monthlyPayment ?? settings?.defaultFee ?? 0,
        method: a.paymentMethod ?? settings?.defaultMethod ?? FALLBACK_METHOD,
        payer: payerOf(a),
        residents: a.residents.map((r) => ({ userId: r.userId, name: r.user.name, relationType: r.relationType })),
        // null = the month has no charge for this apartment yet.
        payment: row ? { amount: row.amount, status: row.status, paidAt: row.paidAt, method: row.method } : null,
      };
    });
    return {
      month: monthKey(period),
      // null = not set up yet: the tile asks management to set payments up.
      settings: settings && {
        openMode: settings.openMode,
        openDay: settings.openDay,
        defaultFee: settings.defaultFee,
        defaultMethod: settings.defaultMethod,
      },
      opened: rows.length > 0,
      // Apartments added after the month was opened; "Open this month" again adds them.
      missing: list.filter((a) => a.payment === null).length,
      goal,
      collected,
      complete: goal > 0 && collected === goal,
      apartments: list,
    };
  }

  // ---- Residents ----

  /** The member's links to apartments in this building (each with the apartment and its residents). */
  private links(userId: string, buildingId: string) {
    return this.prisma.apartmentResident.findMany({
      where: { userId, apartment: { buildingId } },
      include: { apartment: { include: RESIDENTS_INCLUDE } },
      orderBy: { apartment: { number: 'asc' } },
    });
  }

  /**
   * The signed-in member's own apartments: who pays, this month's charge, and past months since they
   * were linked to the apartment. Never anyone else's apartments, nor a previous resident's months.
   */
  async mine(cognitoSub: string, buildingId: string) {
    const user = await this.buildingsService.requireMember(cognitoSub, buildingId);
    const settings = await this.settings(buildingId);
    await this.autoOpen(buildingId, settings);
    const links = await this.links(user.id, buildingId);
    const period = currentPeriod();
    const rows = await this.prisma.payment.findMany({
      where: { buildingId, apartmentId: { in: links.map((l) => l.apartmentId) } },
      orderBy: { period: 'desc' },
    });
    const since = new Map(links.map((l) => [l.apartmentId, currentPeriod(l.linkedAt).getTime()]));
    return {
      month: monthKey(period),
      apartments: links.map((l) => {
        const row = rows.find((r) => r.apartmentId === l.apartmentId && r.period.getTime() === period.getTime());
        const payer = payerOf(l.apartment);
        return {
          apartmentId: l.apartmentId,
          number: l.apartment.number,
          relationType: l.relationType as RelationType,
          payer,
          isPayer: payer?.id === user.id,
          // Owners choose who pays; they pick from the apartment's residents.
          canChoosePayer: l.relationType === 'owner',
          residents: l.apartment.residents.map((r) => ({ userId: r.userId, name: r.user.name, relationType: r.relationType })),
          // null = management hasn't opened this month yet.
          payment: row ? { amount: row.amount, status: row.status, paidAt: row.paidAt, method: row.method } : null,
        };
      }),
      history: rows
        .filter((r) => r.period.getTime() < period.getTime() && r.period.getTime() >= (since.get(r.apartmentId!) ?? Infinity))
        .slice(0, 36)
        .map((r) => ({ period: monthKey(r.period), apartmentNumber: r.apartmentNumber, amount: r.amount, status: r.status, paidAt: r.paidAt })),
    };
  }

  /** One of the member's apartments' log: every month since they were linked to it. */
  async apartmentLog(cognitoSub: string, buildingId: string, apartmentId: number) {
    const user = await this.buildingsService.requireMember(cognitoSub, buildingId);
    const link = await this.prisma.apartmentResident.findFirst({ where: { userId: user.id, apartmentId, apartment: { buildingId } } });
    if (!link) throw new ForbiddenException('This is not your apartment');
    const rows = await this.prisma.payment.findMany({
      where: { buildingId, apartmentId, period: { gte: currentPeriod(link.linkedAt) } },
      orderBy: { period: 'desc' },
      include: LOG_INCLUDE,
    });
    return rows.map(logRow);
  }

  /** An owner chooses who pays the apartment's fee (one of its residents; null = back to the owner). */
  async setPayer(cognitoSub: string, buildingId: string, apartmentId: number, payerId: string | null) {
    const user = await this.buildingsService.requireMember(cognitoSub, buildingId);
    const link = await this.prisma.apartmentResident.findFirst({ where: { userId: user.id, apartmentId, apartment: { buildingId } } });
    if (!link) throw new ForbiddenException('This is not your apartment');
    if (link.relationType !== 'owner') throw new ForbiddenException('Only an owner chooses who pays');
    if (payerId) {
      const target = await this.prisma.apartmentResident.findFirst({ where: { apartmentId, userId: payerId } });
      if (!target) throw new BadRequestException('The payer must live in or own this apartment');
    }
    await this.prisma.apartment.update({ where: { id: apartmentId }, data: { payerId } });
    return this.mine(cognitoSub, buildingId);
  }

  /** Demo "Pay": counts instantly (`self`). Only the apartment's payer, and only this month's charge. */
  async pay(cognitoSub: string, buildingId: string, apartmentId: number) {
    const user = await this.buildingsService.requireMember(cognitoSub, buildingId);
    const settings = await this.settings(buildingId);
    const link = await this.prisma.apartmentResident.findFirst({
      where: { userId: user.id, apartmentId, apartment: { buildingId } },
      include: { apartment: { include: RESIDENTS_INCLUDE } },
    });
    if (!link) throw new ForbiddenException('This is not your apartment');
    if (payerOf(link.apartment)?.id !== user.id) throw new ForbiddenException("Only the apartment's payer can pay");
    const row = await this.prisma.payment.findFirst({ where: { buildingId, apartmentId, period: currentPeriod() } });
    if (!row) throw new BadRequestException('Management has not opened this month yet');
    await this.prisma.payment.updateMany({
      where: { id: row.id, status: 'unpaid' },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paidById: user.id,
        confirmedById: user.id,
        confirmation: 'self',
        method: link.apartment.paymentMethod ?? settings?.defaultMethod ?? FALLBACK_METHOD,
      },
    });
    return this.mine(cognitoSub, buildingId);
  }
}
