import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Reference data only: the CBS settlement list the "create building" form needs.
// No demo buildings, no mock users, so it is safe to run in staging and prod.
// Insert-only (skipDuplicates), so running it again changes nothing.
// On AWS, DB_SSL_CA points at the RDS CA bundle; locally it is unset.
const caPath = process.env.DB_SSL_CA;
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ...(caPath ? { ssl: { ca: readFileSync(caPath, 'utf8') } } : {}),
  }),
});

const CITIES: { id: number; name: string }[] = JSON.parse(
  readFileSync(new URL('./data/cities.json', import.meta.url), 'utf8'),
);

const { count } = await prisma.city.createMany({ data: CITIES, skipDuplicates: true });
console.log(`Cities: ${count} inserted (${CITIES.length} in source).`);
await prisma.$disconnect();
