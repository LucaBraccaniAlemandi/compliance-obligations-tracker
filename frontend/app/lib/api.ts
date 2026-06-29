import 'server-only';

/**
 * Server-only HTTP client for the separate backend service.
 *
 * The browser never talks to the backend directly: this module imports
 * `server-only`, so any accidental import from a Client Component is a build
 * error. The backend base URL and (future) credentials stay on the server.
 */

const BASE_URL = process.env.BACKEND_API_URL;

function baseUrl(): string {
  if (!BASE_URL) {
    throw new Error(
      'BACKEND_API_URL is not set. Add it to your .env (see .env.example).',
    );
  }
  return BASE_URL.replace(/\/$/, '');
}

/** Error thrown for non-2xx backend responses. Carries status + parsed body. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Backend request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type ApiRequestInit = RequestInit & {
  /** JSON-serializable request body. Sets Content-Type automatically. */
  json?: unknown;
};

/**
 * Core fetch wrapper. Prefixes the backend base URL, sends/accepts JSON, and
 * throws `ApiError` on non-2xx responses.
 *
 * Reads are uncached by default (`no-store`) because compliance data is
 * dynamic. Pass `cache`/`next` in `init` to opt into caching for a given call.
 */
export async function apiFetch<T>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  const { json, headers, ...rest } = init;

  const res = await fetch(`${baseUrl()}${path}`, {
    cache: 'no-store',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const payload = await parseBody(res);

  if (!res.ok) {
    throw new ApiError(res.status, payload);
  }

  return payload as T;
}

async function parseBody(res: Response): Promise<unknown> {
  // 204 No Content and empty bodies have nothing to parse.
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined;
  }
  const text = await res.text();
  if (!text) return undefined;

  const contentType = res.headers.get('content-type') ?? '';
  return contentType.includes('application/json') ? JSON.parse(text) : text;
}

export function apiGet<T>(path: string, init?: ApiRequestInit): Promise<T> {
  return apiFetch<T>(path, { ...init, method: 'GET' });
}

export function apiPost<T>(
  path: string,
  json?: unknown,
  init?: ApiRequestInit,
): Promise<T> {
  return apiFetch<T>(path, { ...init, method: 'POST', json });
}

export function apiPut<T>(
  path: string,
  json?: unknown,
  init?: ApiRequestInit,
): Promise<T> {
  return apiFetch<T>(path, { ...init, method: 'PUT', json });
}

export function apiPatch<T>(
  path: string,
  json?: unknown,
  init?: ApiRequestInit,
): Promise<T> {
  return apiFetch<T>(path, { ...init, method: 'PATCH', json });
}

export function apiDelete<T>(path: string, init?: ApiRequestInit): Promise<T> {
  return apiFetch<T>(path, { ...init, method: 'DELETE' });
}
