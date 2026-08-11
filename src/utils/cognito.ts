import { Tokens } from '../types/auth';

export const COGNITO_DOMAIN = 'https://us-east-1vzrobltfk.auth.us-east-1.amazoncognito.com';
export const CLIENT_ID = '75cobltus9jirug7n3hmibh2i4';
export const SCOPES = 'openid email profile';

export function getRedirectUri(): string {
  return `${window.location.origin}/callback`;
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

  const isExpired = Date.now() >= parseInt(expiry, 10);
  if (isExpired) {
    clearTokens();
    return false;
  }

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
