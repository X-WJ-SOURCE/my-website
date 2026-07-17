import { v4 as uuidv4 } from 'uuid';

const TOKEN_KEY = 'token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function api(path: string, options: ApiOptions = {}): Promise<unknown> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const method = options.method || 'GET';
  if (['POST', 'PUT', 'PATCH'].includes(method) && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
    body:
      options.body instanceof FormData
        ? options.body
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `请求失败 (状态码: ${response.status})`);
  }

  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

api.get = (path: string) => api(path, { method: 'GET' });
api.post = (path: string, body?: unknown) => api(path, { method: 'POST', body });
api.put = (path: string, body?: unknown) => api(path, { method: 'PUT', body });
api.delete = (path: string) => api(path, { method: 'DELETE' });

const VISITOR_ID_KEY = 'visitor_id';

export function getVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = uuidv4();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const result = await api('/upload', { method: 'POST', body: formData }) as { url: string };
  return result;
}
