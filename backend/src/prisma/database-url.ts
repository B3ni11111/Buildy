import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

/**
 * Makes sure process.env.DATABASE_URL is set before Prisma starts.
 *
 * Locally (docker compose, .env) DATABASE_URL is given directly and nothing happens here.
 * On AWS Lambda the password lives in Secrets Manager (it can rotate), so Terraform only
 * passes DB_HOST, DB_PORT, DB_NAME and DB_SECRET_ARN. We read the secret once per cold
 * start and build the URL here.
 *
 * No `sslmode` is put in the URL on purpose: SSL is configured in PrismaService from
 * DB_SSL_CA, so the server certificate is checked against the RDS CA bundle.
 */
export async function ensureDatabaseUrl(): Promise<void> {
  if (process.env.DATABASE_URL) return;

  const { DB_SECRET_ARN, DB_HOST, DB_PORT, DB_NAME } = process.env;
  if (!DB_SECRET_ARN || !DB_HOST || !DB_NAME) {
    throw new Error('Set DATABASE_URL, or DB_SECRET_ARN + DB_HOST + DB_NAME (+ DB_PORT).');
  }

  const client = new SecretsManagerClient({});
  const res = await client.send(new GetSecretValueCommand({ SecretId: DB_SECRET_ARN }));
  if (!res.SecretString) throw new Error('The database secret has no SecretString.');
  const { username, password } = JSON.parse(res.SecretString) as { username: string; password: string };

  const user = encodeURIComponent(username);
  const pass = encodeURIComponent(password);
  process.env.DATABASE_URL = `postgresql://${user}:${pass}@${DB_HOST}:${DB_PORT ?? '5432'}/${DB_NAME}?schema=public`;
}
