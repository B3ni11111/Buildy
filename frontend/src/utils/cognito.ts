import { Tokens } from '../types/auth';

const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const SCOPES = import.meta.env.VITE_COGNITO_SCOPE;
const REDIRECT_URI_OVERRIDE = import.meta.env.VITE_REDIRECT_URI;

console.log('[AUTH DEBUG] Cognito env vars:', {
  VITE_COGNITO_DOMAIN: COGNITO_DOMAIN,
  VITE_COGNITO_CLIENT_ID: CLIENT_ID,
  VITE_COGNITO_SCOPE: SCOPES,
  VITE_REDIRECT_URI: REDIRECT_URI_OVERRIDE,
});

export function getRedirectUri(): string {
  return REDIRECT_URI_OVERRIDE || `${window.location.origin}/callback`;
}

export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    identity_provider: 'Google',
  });
  return `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<Tokens> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code,
    redirect_uri: getRedirectUri(),
  });

  const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Token exchange failed: ${errorData.error || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Trades the long-lived refresh token (30 days by default in Cognito) for fresh
 * id/access tokens, so the user stays signed in across reloads without seeing
 * the Google login again. Cognito doesn't return a new refresh token here, so
 * the existing one is carried over.
 */
export async function refreshTokens(refreshToken: string): Promise<Tokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  });
  const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Token refresh failed: ${errorData.error || response.statusText}`);
  }
  const fresh: Tokens = await response.json();
  return { ...fresh, refresh_token: fresh.refresh_token ?? refreshToken };
}

/** When the stored id/access tokens expire (ms since epoch), or null if none. */
export function getTokenExpiry(): number | null {
  const expiry = localStorage.getItem('token_expiry');
  return expiry ? parseInt(expiry, 10) : null;
}

export function saveTokens(tokens: Tokens): void {
  localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  localStorage.setItem('token_expiry', String(Date.now() + tokens.expires_in * 1000));
}

export function getStoredTokens(): Tokens | null {
  try {
    const stored = localStorage.getItem('auth_tokens');
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function isTokenValid(): boolean {
  const expiry = localStorage.getItem('token_expiry');
  if (!expiry) return false;

  // Expired tokens are kept: their refresh_token can still renew the session.
  if (Date.now() >= parseInt(expiry, 10)) return false;

  try {
    const tokens = getStoredTokens();
    if (!tokens || !tokens.id_token) return false;

    // Validate JWT format
    const parts = tokens.id_token.split('.');
    if (parts.length !== 3) return false;

    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export function clearTokens(): void {
  localStorage.removeItem('auth_tokens');
  localStorage.removeItem('token_expiry');
}

export interface UserInfo {
  sub: string;
  email?: string;
  name?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  picture?: string;
  [key: string]: unknown;
}

export function decodeIdToken(idToken: string): UserInfo {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const decoded = JSON.parse(atob(parts[1]));
  return decoded;
}
