const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const TOKEN_KEY = 'camelia_token';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY),
  set: (token: string, remember = true) => {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem(TOKEN_KEY);
    storage.setItem(TOKEN_KEY, token);
  },
  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },
};

function detailFrom(body: unknown): string {
  if (typeof body === 'object' && body !== null) {
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length) {
      const first = detail[0] as { msg?: string; loc?: string[] };
      const field = first.loc?.filter((part) => part !== 'body').join('.');
      return field ? `${field}: ${first.msg ?? 'invalid value'}` : first.msg ?? 'Invalid request.';
    }
  }
  return 'Something went wrong. Please try again.';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Cannot reach the Camelia API. Is the backend running on port 9000?', 0);
  }

  if (response.status === 401) {
    tokenStore.clear();
    window.dispatchEvent(new Event('camelia:unauthorized'));
  }
  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      /* non-JSON error page */
    }
    throw new ApiError(detailFrom(body), response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/**
 * Turns a path the API returned into something an <img> can load.
 *
 * Dish photos come from two places: the demo menu's bundled artwork
 * (`/images/...`, shipped with the frontend) and photos uploaded through the
 * admin dashboard (`/uploads/...`, served by the API). The first is always
 * relative to this site. The second lives on the API origin, which is a
 * different host once the frontend and backend are deployed separately.
 */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith('/uploads/')) return path;
  return `${API_BASE}${path}`;
}

/** Uploads a dish photo and returns the path to store as the dish's image_url. */
export async function uploadDishImage(file: File): Promise<string> {
  const token = tokenStore.get();
  const body = new FormData();
  body.append('file', file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/admin/uploads/dish-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body,
    });
  } catch {
    throw new ApiError('Cannot reach the Camelia API. Is the backend running on port 9000?', 0);
  }

  if (!response.ok) {
    let detail: unknown = null;
    try {
      detail = await response.json();
    } catch {
      /* non-JSON error page */
    }
    throw new ApiError(detailFrom(detail), response.status);
  }
  const data = (await response.json()) as { url: string };
  return data.url;
}

export const formatRwf = (value: number) => `RWF ${value.toLocaleString('en-RW')}`;

export const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
