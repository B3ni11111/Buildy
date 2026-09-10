import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const BUILDINGS = [
  { name: 'Maple Court', address: '14 Ben Yehuda St, Tel Aviv', password: 'maple-2026' },
  { name: 'Rothschild Gardens', address: '82 Rothschild Blvd, Tel Aviv', password: 'rothschild-2026' },
  { name: 'HaYarkon Terrace', address: '210 HaYarkon St, Tel Aviv', password: 'yarkon-2026' },
];

async function main() {
  for (const building of BUILDINGS) {
    const passwordHash = await hash(building.password, 10);
    // create-only: an existing row's passwordHash is left alone, so a manual
    // password change survives future `docker compose up` / seed re-runs.
    await prisma.building.upsert({
      where: { address: building.address },
      update: {},
      create: { name: building.name, address: building.address, passwordHash },
    });
  }
  console.log(`Seed complete: ${BUILDINGS.length} buildings ensured.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
