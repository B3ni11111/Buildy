import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';

interface RequestContext {
  /** Set when an admin previews the app as a resident (header `X-View-As: resident`). */
  viewAsResident: boolean;
}

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Express middleware: records per request whether the client asked to be treated as a
 * resident. It can only take powers away (admin bypasses, building management), never add any.
 */
export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  storage.run({ viewAsResident: req.headers['x-view-as'] === 'resident' }, next);
}

/** True while handling a request sent in "view as resident" mode. */
export function actingAsResident(): boolean {
  return storage.getStore()?.viewAsResident ?? false;
}

/** The user's admin flag as it applies to this request. */
export function effectiveAdmin(user: { isAdmin: boolean } | null | undefined): boolean {
  return !!user?.isAdmin && !actingAsResident();
}
