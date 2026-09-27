import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';

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
  password: string;
  description: string;
  entryCode: string;
  contacts: SeedContact[];
}[] = [
  {
    name: 'Maple Court',
    cityId: TEL_AVIV,
    address: '14 Ben Yehuda St',
    password: 'maple-2026',
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
    password: 'rothschild-2026',
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
    password: 'yarkon-2026',
    description: 'Sea-facing, 9 floors, underground parking.',
    entryCode: '2100',
    contacts: [{ type: 'phone', link: '+972-3-555-0210' }],
  },
];

async function main() {
  // Insert-only: existing codes are left untouched, so re-running is a no-op.
  const { count } = await prisma.city.createMany({ data: CITIES, skipDuplicates: true });
  console.log(`Cities: ${count} inserted (${CITIES.length} in source).`);

  for (const building of BUILDINGS) {
    const passwordHash = await hash(building.password, 10);
    // create-only: an existing row's passwordHash is left alone, so a manual
    // password change survives future `docker compose up` / seed re-runs.
    const row = await prisma.building.upsert({
      where: { cityId_address: { cityId: building.cityId, address: building.address } },
      update: {},
      create: {
        name: building.name,
        cityId: building.cityId,
        address: building.address,
        passwordHash,
        description: building.description,
        entryCode: building.entryCode,
      },
    });
    // Only add demo contact links to a building that has none yet.
    const existingLinks = await prisma.contactLink.count({ where: { buildingId: row.id } });
    if (existingLinks === 0) {
      await prisma.contactLink.createMany({
        data: building.contacts.map((c) => ({ ...c, buildingId: row.id })),
      });
    }
  }
  console.log(`Seed complete: ${BUILDINGS.length} buildings ensured.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
