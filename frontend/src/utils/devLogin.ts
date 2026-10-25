import { Tokens } from '../types/auth';
import { saveTokens } from './cognito';
import { clearOnboardingData } from './onboarding';

/**
 * Dev-only "sign in as" a seeded mock user (no Google login), for testing every role locally.
 * Shown only when VITE_DEV_LOGIN=true (docker-compose.override.yml); the backend accepts these
 * tokens only with its own DEV_LOGIN=true, and only for `mock-user-*` accounts.
 */
export const devLoginEnabled = import.meta.env.VITE_DEV_LOGIN === 'true';

export interface DevUser {
  sub: string;
  id: string;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  roles: { building: string; role: string }[];
  apartments: { building: string; number: number; relationType: string }[];
}

const encode = (value: unknown) => btoa(unescape(encodeURIComponent(JSON.stringify(value))));

/** An unsigned, JWT-shaped token (`<header>.<payload>.dev`) the dev backend maps to the mock user. */
function devIdToken(user: DevUser) {
  const payload = { sub: user.sub, name: user.name ?? undefined, email: user.email ?? undefined };
  return `${encode({ alg: 'none', typ: 'dev' })}.${encode(payload)}.dev`;
}

export const isDevToken = (idToken: string | undefined) => !!idToken && idToken.split('.')[2] === 'dev';

/** Stores dev tokens for this mock user and reloads, so the app starts signed in as them. */
export function signInAsDevUser(user: DevUser) {
  // Forget the previous account's per-device choices (like a real sign-out does).
  clearOnboardingData();
  for (const key of ['buildy_current_building', 'buildy_view_as', 'buildy_view_as_resident']) {
    try {
      localStorage.removeItem(key);
    } catch {
      // nothing stored
    }
  }
  const idToken = devIdToken(user);
  const tokens: Tokens = { access_token: idToken, id_token: idToken, expires_in: 30 * 24 * 3600, token_type: 'Bearer' };
  saveTokens(tokens);
  window.location.assign('/');
}
