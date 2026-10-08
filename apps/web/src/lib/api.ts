const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error?.toString() ?? `Request failed: ${res.status}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}