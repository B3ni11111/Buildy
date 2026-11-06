import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { ensureDatabaseUrl } from './prisma/database-url.js';

/**
 * "Migrate mode" (RUN_MODE=migrate): used by a second Lambda made from the same image.
 *
 * The database sits in private subnets, so a laptop can't run `prisma migrate deploy`.
 * Instead this tiny server does it when it gets a POST request. Run it once after each deploy:
 *   aws lambda invoke --function-name buildy-<env>-migrate --payload <POST event> out.json
 *
 * GET/HEAD only answer "ok" (the Lambda Web Adapter's readiness check is a GET, and must never
 * run migrations). This Lambda has no public URL; only people with AWS access can invoke it.
 * It never seeds data: seed/demo users must not reach prod.
 */
export async function runMigrateServer() {
  const port = Number(process.env.PORT ?? 3000);

  createServer(async (req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('migrate mode: send POST to run `prisma migrate deploy`\n');
      return;
    }
    try {
      await ensureDatabaseUrl();
      // The Prisma CLI (schema engine) takes SSL settings from the URL, not from our code.
      const ca = process.env.DB_SSL_CA;
      const url = ca
        ? `${process.env.DATABASE_URL}&sslmode=require&sslcert=${encodeURIComponent(ca)}`
        : process.env.DATABASE_URL;
      const result = spawnSync('node_modules/.bin/prisma', ['migrate', 'deploy'], {
        env: { ...process.env, DATABASE_URL: url, HOME: '/tmp' }, // Lambda only lets us write in /tmp
        encoding: 'utf8',
      });
      const ok = result.status === 0;
      res.writeHead(ok ? 200 : 500, { 'content-type': 'text/plain' });
      res.end(`exit ${result.status}\n${result.stdout}\n${result.stderr}\n${result.error ?? ''}`);
    } catch (err) {
      res.writeHead(500, { 'content-type': 'text/plain' });
      res.end(`failed: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }).listen(port, () => console.log(`migrate mode listening on ${port}`));
}
