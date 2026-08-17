import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

export const REQUEST_ID_HEADER = 'x-request-id';

interface RequestContext {
  requestId: string;
}

/**
 * Carries the request id through async call stacks without threading it
 * through every function signature, so the logger can pick it up implicitly.
 */
const storage = new AsyncLocalStorage<RequestContext>();

export const getRequestId = (): string | undefined => storage.getStore()?.requestId;

/**
 * Adopt the caller's correlation id, or mint one.
 *
 * The Flask API forwards its own id, which is what makes a single user action
 * traceable across both services.
 */
export const requestContext = (req: Request, res: Response, next: NextFunction): void => {
  const inbound = req.get(REQUEST_ID_HEADER);
  // Bounded: this value reaches log lines and response headers.
  const requestId = inbound ? inbound.slice(0, 64) : randomUUID().replace(/-/g, '').slice(0, 16);

  res.setHeader('X-Request-ID', requestId);
  storage.run({ requestId }, () => next());
};
