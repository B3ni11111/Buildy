// Grant (or revoke) the global admin flag for an existing user, by email.
// The user must have signed in at least once so their row exists.
//
//   docker compose exec backend npm run admin:grant -- someone@example.com
//   docker compose exec backend npm run admin:grant -- someone@example.com --revoke
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const email = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
  const revoke = process.argv.includes('--revoke');
  if (!email) {
    console.error('Usage: npm run admin:grant -- <email> [--revoke]');
    process.exitCode = 1;
    return;
  }

  const { count } = await prisma.user.updateMany({ where: { email }, data: { isAdmin: !revoke } });
  if (count === 0) {
    console.error(`No user with email ${email} — sign in once first, then re-run.`);
    process.exitCode = 1;
    return;
  }
  console.log(`${email} is ${revoke ? 'no longer an admin' : 'now an admin'}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
