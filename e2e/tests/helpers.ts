import { expect, type Page } from '@playwright/test';

export const API_URL = process.env.BUILDY_API_URL ?? 'http://localhost:3000';

/** The seeded mock users (backend/prisma/seed.ts). Dev sign-in only works for these. */
export const USERS = {
  noa: { sub: 'mock-user-1', id: '00000000-0000-4000-8000-000000000001', name: 'Noa Levi' },
  shira: { sub: 'mock-user-7', id: '00000000-0000-4000-8000-000000000007', name: 'Shira Dahan' },
  avi: { sub: 'mock-user-8', id: '00000000-0000-4000-8000-000000000008', name: 'Avi Friedman' },
  lior: { sub: 'mock-user-9', id: '00000000-0000-4000-8000-000000000009', name: 'Lior Azulay' },
  /** The only mock admin (Claude's test account). */
  admin: { sub: 'mock-user-11', id: '00000000-0000-4000-8000-000000000011', name: 'claudeAdminTesting' },
} as const;
export type TestUser = (typeof USERS)[keyof typeof USERS];

/** The same unsigned dev token the app's "Dev: sign in as…" list makes (frontend/src/utils/devLogin.ts). */
export function devToken(user: TestUser) {
  const enc = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64');
  return `${enc({ alg: 'none', typ: 'dev' })}.${enc({ sub: user.sub, name: user.name })}.dev`;
}

/** Calls the API as a user; throws with the response body on a non-2xx status. */
export async function api<T = unknown>(user: TestUser, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${devToken(user)}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/** Status code only (for permission checks). */
export async function apiStatus(user: TestUser, method: string, path: string) {
  const res = await fetch(`${API_URL}${path}`, { method, headers: { Authorization: `Bearer ${devToken(user)}` } });
  return res.status;
}

/** Signs the browser in as `user` (dev token in localStorage) and opens the app on `buildingId`. */
export async function signInAs(page: Page, user: TestUser, buildingId?: string) {
  await page.goto('/');
  await page.evaluate(
    ({ token, buildingId }) => {
      localStorage.clear();
      localStorage.setItem('auth_tokens', JSON.stringify({ access_token: token, id_token: token, expires_in: 2592000, token_type: 'Bearer' }));
      localStorage.setItem('token_expiry', String(Date.now() + 2592000000));
      if (buildingId) localStorage.setItem('buildy_current_building', buildingId);
    },
    { token: devToken(user), buildingId },
  );
  await page.goto('/');
}

/** The Payments tile on the home screen. */
export const paymentsTile = (page: Page) =>
  page.locator('.MuiCard-root').filter({ has: page.getByRole('heading', { name: 'Payments', exact: true }) });

export interface TestBuilding {
  id: string;
  name: string;
}

/**
 * A throwaway building made by the admin, with payments set up (manual, ₪300 default, card):
 *   apt 1 — Avi (owner) + Lior (renter); fee ₪300 (building default)
 *   apt 2 — Shira (owner, committee head); fee ₪500, cash
 */
export async function createTestBuilding(label: string): Promise<TestBuilding> {
  const name = `E2E ${label} ${Date.now()}`;
  const created = await api<{ id: string }>(USERS.admin, 'POST', '/admin/buildings', {
    name,
    cityId: 5000,
    address: name,
    residents: [
      { userId: USERS.avi.id, apartments: [{ number: 1, relationType: 'owner', floor: 1 }] },
      { userId: USERS.lior.id, apartments: [{ number: 1, relationType: 'tenant', floor: 1 }] },
      { userId: USERS.shira.id, apartments: [{ number: 2, relationType: 'owner', floor: 2, paymentMethod: 'cash' }] },
    ],
    payments: { openMode: 'manual', openDay: 1, defaultFee: 300, defaultMethod: 'card' },
  });
  await api(USERS.admin, 'PUT', `/admin/buildings/${created.id}/members/${USERS.shira.id}/role`, { role: 'committee_head' });
  // Apt 2's own fee (₪500), set as management would.
  const overview = await api<{ apartments: { apartmentId: number; number: number }[] }>(USERS.shira, 'GET', `/buildings/${created.id}/manage/payments`);
  const apt2 = overview.apartments.find((a) => a.number === 2)!;
  await api(USERS.shira, 'PATCH', `/buildings/${created.id}/manage/payments/${apt2.apartmentId}/fee`, { amount: 500, scope: 'permanent' });
  return { id: created.id, name };
}

export async function deleteTestBuilding(building: TestBuilding | undefined) {
  if (building) await api(USERS.admin, 'DELETE', `/admin/buildings/${building.id}`).catch(() => {});
}

/**
 * In dev a payments "month" lasts 5 minutes (PAYMENTS_PERIOD_MINUTES). A test that opens a month and
 * pays must not cross into the next one, so wait if the current period ends within `marginSec`.
 */
export async function waitForFreshPeriod(marginSec = 90, periodMinutes = Number(process.env.PAYMENTS_PERIOD_MINUTES ?? 5)) {
  const periodMs = periodMinutes * 60_000;
  const left = periodMs - (Date.now() % periodMs);
  if (left < marginSec * 1000) await new Promise((r) => setTimeout(r, left + 2000));
}

export { expect };
