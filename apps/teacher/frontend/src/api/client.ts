const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_000;

export interface ApiError {
  code: string;
  message: string;
  details?: { message: string }[];
  status: number;
}

export class ApiClientError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
  }
}

function getToken(): string | null {
  return sessionStorage.getItem('mindforge_teacher_token');
}

export function setToken(token: string): void {
  sessionStorage.setItem('mindforge_teacher_token', token);
}

export function clearToken(): void {
  sessionStorage.removeItem('mindforge_teacher_token');
}

export function hasToken(): boolean {
  return !!getToken();
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retries = MAX_RETRIES,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ code: 'UNKNOWN', message: res.statusText }));
      throw new ApiClientError({
        code: err.code ?? 'UNKNOWN',
        message: err.message ?? res.statusText,
        details: err.details,
        status: res.status,
      });
    }

    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiClientError) throw err;

    const isNetworkError =
      err instanceof TypeError || (err instanceof DOMException && err.name === 'AbortError');

    if (isNetworkError && retries > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return request<T>(method, path, body, retries - 1);
    }

    throw new ApiClientError({
      code: 'NETWORK_ERROR',
      message: navigator.onLine ? 'Request failed. Please try again.' : 'You are offline.',
      status: 0,
    });
  }
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(url, { method: 'POST', headers, body: formData, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ code: 'UNKNOWN', message: res.statusText }));
      throw new ApiClientError({ code: err.code, message: err.message, status: res.status });
    }

    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiClientError) throw err;
    throw new ApiClientError({ code: 'UPLOAD_FAILED', message: 'Upload failed', status: 0 });
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, formData: FormData) => upload<T>(path, formData),
};
