import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Official CBS (הלמ"ס) settlement list — id is the "סמל יישוב" code.
// Source: https://data.gov.il/dataset/citiesandsettelments (datastore API,
// resource 5c78e9fa-c2e2-4771-93ff-7f400a12f7ba). Refresh by re-exporting
// that resource into prisma/data/cities.json.
const CITIES: { id: number; name: string }[] = JSON.parse(
  readFileSync(new URL('./data/cities.json', import.meta.url), 'utf8'),
);

const TEL_AVIV = 5000;

type SeedContact = { type: 'email' | 'whatsapp' | 'phone'; link: string };

const BUILDINGS: {
  name: string;
  cityId: number;
  address: string;
  description: string;
  entryCode: string;
  contacts: SeedContact[];
}[] = [
  {
    name: 'Maple Court',
    cityId: TEL_AVIV,
    address: '14 Ben Yehuda St',
    description: '6 floors, 24 units. Elevator serviced every March.',
    entryCode: '1948',
    contacts: [
      { type: 'whatsapp', link: 'https://chat.whatsapp.com/maple-court-demo' },
      { type: 'email', link: 'committee@maplecourt.example' },
    ],
  },
  {
    name: 'Rothschild Gardens',
    cityId: TEL_AVIV,
    address: '82 Rothschild Blvd',
    description: 'Bauhaus building, 4 floors, shared rooftop.',
    entryCode: '0821',
    contacts: [
      { type: 'whatsapp', link: 'https://chat.whatsapp.com/rothschild-demo' },
      { type: 'phone', link: '+972-3-555-0182' },
    ],
  },
  {
    name: 'HaYarkon Terrace',
    cityId: TEL_AVIV,
    address: '210 HaYarkon St',
    description: 'Sea-facing, 9 floors, underground parking.',
    entryCode: '2100',
    contacts: [{ type: 'phone', link: '+972-3-555-0210' }],
  },
];

// Mock residents for trying the add-by-ID flow. They have no Cognito login: a committee head pastes
// their IDs, and in dev (DEV_LOGIN=true) the sign-in page can "sign in as" them. Fixed IDs, so they're
// the same on every machine.
const MOCK_USERS = [
  'Noa Levi',
  'Daniel Cohen',
  'Maya Mizrahi',
  'Yossi Peretz',
  'Tamar Katz',
  'Omer Biton',
  'Shira Dahan',
  'Avi Friedman',
  'Lior Azulay',
  'Rina Shapiro',
].map((name, i) => ({
  id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  cognitoSub: `mock-user-${i + 1}`,
  name,
  email: `mock${i + 1}@buildy.test`,
}));

/**
 * Dev only (DEV_LOGIN=true): a building where the mock users hold every role, so each flow can be
 * tried by "signing in as" them (dev login). Create-only: once it exists it is left alone, so
 * whatever was done while testing survives a restart. Delete it from the admin console to reset.
 */
const PLAYGROUND = { name: 'Dev Playground', address: '1 Test St' };
const mockId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const PLAYGROUND_ROLES: { user: number; role: 'committee_head' | 'management_company' | 'resident' }[] = [
  { user: 1, role: 'committee_head' }, // Noa: committee head, also owns and lives in apt 1
  { user: 2, role: 'resident' }, // Daniel: owns apt 2 (rented out to Maya)
  { user: 3, role: 'resident' }, // Maya: renter in apt 2
  { user: 4, role: 'resident' }, // Yossi: owns apt 3 and apt 4
  { user: 5, role: 'resident' }, // Tamar: renter in apt 3
  { user: 6, role: 'management_company' }, // Omer: management company, no apartment
];
const PLAYGROUND_APARTMENTS: { number: number; floor: number; fee: number | null; method: 'card' | 'cash' | 'transfer' | 'bit_paybox' | null; residents: { user: number; relation: 'owner' | 'tenant' }[] }[] = [
  { number: 1, floor: 1, fee: null, method: null, residents: [{ user: 1, relation: 'owner' }] },
  { number: 2, floor: 1, fee: 450, method: 'bit_paybox', residents: [{ user: 2, relation: 'owner' }, { user: 3, relation: 'tenant' }] },
  { number: 3, floor: 2, fee: null, method: 'cash', residents: [{ user: 4, relation: 'owner' }, { user: 5, relation: 'tenant' }] },
  { number: 4, floor: 3, fee: 600, method: 'transfer', residents: [{ user: 4, relation: 'owner' }] },
];
// The only mock admin (dev only): Claude's account for testing the admin console. No other mock user is an admin.
const DEV_ADMIN = { id: mockId(11), cognitoSub: 'mock-user-11', name: 'claudeAdminTesting', email: 'claude-admin@buildy.test' };

async function seedDevPlayground() {
  const exists = await prisma.building.findUnique({ where: { cityId_address: { cityId: TEL_AVIV, address: PLAYGROUND.address } } });
  await prisma.user.updateMany({ where: { cognitoSub: { startsWith: 'mock-user-' }, NOT: { id: DEV_ADMIN.id } }, data: { isAdmin: false } });
  await prisma.user.upsert({
    where: { cognitoSub: DEV_ADMIN.cognitoSub },
    update: { isAdmin: true },
    create: { ...DEV_ADMIN, isAdmin: true, language: 'en', onboardedAt: new Date() },
  });
  if (exists) {
    console.log(`Dev playground: "${PLAYGROUND.name}" already exists (left as is).`);
    return;
  }
  await prisma.$transaction(async (tx) => {
    const building = await tx.building.create({
      data: { name: PLAYGROUND.name, cityId: TEL_AVIV, address: PLAYGROUND.address, description: 'Dev-only building for trying every role.', entryCode: '1234' },
    });
    for (const { user, role } of PLAYGROUND_ROLES) {
      await tx.buildingUser.create({ data: { buildingId: building.id, userId: mockId(user) } });
      await tx.userRoleAssignment.create({ data: { buildingId: building.id, userId: mockId(user), role } });
    }
    for (const apt of PLAYGROUND_APARTMENTS) {
      const apartment = await tx.apartment.create({
        data: { buildingId: building.id, number: apt.number, floor: apt.floor, monthlyPayment: apt.fee, paymentMethod: apt.method },
      });
      for (const r of apt.residents) {
        await tx.apartmentResident.create({ data: { apartmentId: apartment.id, userId: mockId(r.user), relationType: r.relation } });
      }
    }
    await tx.buildingPaymentSettings.create({ data: { buildingId: building.id, openMode: 'manual', openDay: 1, defaultFee: 400, defaultMethod: 'card' } });
  });
  console.log(`Dev playground: created "${PLAYGROUND.name}" (mock users 1-6); ${DEV_ADMIN.name} is the only mock admin.`);
}

async function main() {
  // Insert-only: existing codes are left untouched, so re-running is a no-op.
  const { count } = await prisma.city.createMany({ data: CITIES, skipDuplicates: true });
  console.log(`Cities: ${count} inserted (${CITIES.length} in source).`);

  for (const building of BUILDINGS) {
    const row = await prisma.building.upsert({
      where: { cityId_address: { cityId: building.cityId, address: building.address } },
      update: {},
      create: {
        name: building.name,
        cityId: building.cityId,
        address: building.address,
        description: building.description,
        entryCode: building.entryCode,
      },
    });
    // Create-only: an existing building is left alone. Only add demo contact links to a building that has none yet.
    const existingLinks = await prisma.contactLink.count({ where: { buildingId: row.id } });
    if (existingLinks === 0) {
      await prisma.contactLink.createMany({
        data: building.contacts.map((c) => ({ ...c, buildingId: row.id })),
      });
    }
  }
  for (const user of MOCK_USERS) {
    // create-only: editing a mock user (e.g. a picture) survives re-seeding
    await prisma.user.upsert({
      where: { cognitoSub: user.cognitoSub },
      update: {},
      create: { ...user, language: 'en', onboardedAt: new Date() },
    });
  }
  const idList = MOCK_USERS.map((u) => `  ${u.id}  ${u.name}`).join('\n');
  console.log(`Mock users (paste these IDs into "Add residents"):\n${idList}`);
  if (process.env.DEV_LOGIN === 'true') await seedDevPlayground();
  console.log(`Seed complete: ${BUILDINGS.length} buildings ensured.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
