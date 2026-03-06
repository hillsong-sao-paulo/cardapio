/** Base URL das API routes (Vercel). Em dev pode ser '' (same origin) ou ex.: http://localhost:3000 */
export const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}
