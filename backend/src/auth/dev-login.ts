import type { AuthUser } from './auth-user.type.js';

/**
 * Dev-only "sign in as" (local Docker, for testing every role — also by Claude with Playwright).
 * On only when `DEV_LOGIN=true` (set in docker-compose.override.yml, never in production). The app
 * then sends a fake, unsigned token `<header>.<payload>.dev` whose header is `{ "typ": "dev" }`;
 * it is accepted only for the seeded mock users (`mock-user-*`), so a real account can never be
 * impersonated, even in dev.
 */
export const devLoginEnabled = () => process.env.DEV_LOGIN === 'true';

export const DEV_SUB_PREFIX = 'mock-user-';

/** The mock user a dev token names, or null if this isn't a (valid) dev token. */
export function parseDevToken(token: string): AuthUser | null {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || signature !== 'dev') return null;
  try {
    const decode = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
    if (decode(header).typ !== 'dev') return null;
    const { sub } = decode(payload) as { sub?: unknown };
    if (typeof sub !== 'string' || !sub.startsWith(DEV_SUB_PREFIX)) return null;
    return { cognitoSub: sub };
  } catch {
    return null;
  }
}
