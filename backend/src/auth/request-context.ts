import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@prisma/client';

const VIEW_ROLES: UserRole[] = ['committee_head', 'management_company', 'resident'];

interface RequestContext {
  /** Set when an admin previews the app as a building role (header `X-View-As: <role>`). */
  viewAs: UserRole | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Express middleware: records per request which building role the client asked to be treated as. */
export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers['x-view-as'];
  const viewAs = VIEW_ROLES.find((role) => role === header) ?? null;
  storage.run({ viewAs }, next);
}

/**
 * The building role this request acts as, or null for the user's real powers.
 * Previewing a management role is honoured only for real admins (they already have every
 * power, so it can only take some away); "resident" can only remove powers, so anyone may send it.
 */
export function viewedRole(user: { isAdmin: boolean } | null | undefined): UserRole | null {
  const viewAs = storage.getStore()?.viewAs ?? null;
  if (viewAs === 'resident') return viewAs;
  return user?.isAdmin ? viewAs : null;
}

/** The user's admin flag as it applies to this request. */
export function effectiveAdmin(user: { isAdmin: boolean } | null | undefined): boolean {
  return !!user?.isAdmin && viewedRole(user) === null;
}
