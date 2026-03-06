/**
 * Cliente NocoDB para uso nas API routes (Vercel). Usa process.env.
 */

const BASE_URL = (process.env.NOCODB_URL ?? '').replace(/\/$/, '');
const API_TOKEN = process.env.NOCODB_API_TOKEN ?? '';
const TABLE_IDS_JSON = process.env.NOCODB_TABLE_IDS ?? '{}';

let tableIds: Record<string, string> = {};
try {
  tableIds = JSON.parse(TABLE_IDS_JSON) as Record<string, string>;
} catch {
  // ignore
}

function getTableId(tableName: string): string {
  const id = tableIds[tableName];
  if (!id) throw new Error(`NocoDB: Table ID não configurado para "${tableName}". Defina NOCODB_TABLE_IDS.`);
  return id;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_TOKEN) h['xc-token'] = API_TOKEN;
  return h;
}

interface ListResponse<T = Record<string, unknown>> {
  list?: T[];
  record?: T[];
}

function getList<T>(resp: ListResponse<T>): T[] {
  if (Array.isArray(resp.list)) return resp.list;
  if (Array.isArray(resp.record)) return resp.record;
  return [];
}

export async function nocodbList<T = Record<string, unknown>>(
  tableName: string,
  options?: { where?: string; limit?: number; offset?: number }
): Promise<T[]> {
  const tableId = getTableId(tableName);
  const url = new URL(`${BASE_URL}/api/v2/tables/${tableId}/records`);
  if (options?.where) url.searchParams.set('where', options.where);
  if (options?.limit != null) url.searchParams.set('limit', String(options.limit));
  if (options?.offset != null) url.searchParams.set('offset', String(options.offset));

  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(`NocoDB ${tableName} list: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as ListResponse<T>;
  return getList(data);
}

export async function nocodbGetById<T = Record<string, unknown>>(tableName: string, id: string): Promise<T | null> {
  const list = await nocodbList<T>(tableName, { where: `(id,eq,${id})`, limit: 1 });
  return list[0] ?? null;
}

export async function nocodbUpdate(
  tableName: string,
  recordId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const tableId = getTableId(tableName);
  const res = await fetch(`${BASE_URL}/api/v2/tables/${tableId}/records/${encodeURIComponent(recordId)}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`NocoDB ${tableName} update: ${res.status} ${await res.text()}`);
}
