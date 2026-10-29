/**
 * Cliente para a REST API do NocoDB (v2).
 * Usa VITE_NOCODB_URL, VITE_NOCODB_API_TOKEN e VITE_NOCODB_TABLE_IDS do env.
 */

const BASE_URL = (import.meta.env.VITE_NOCODB_URL ?? '').replace(/\/$/, '');
const API_TOKEN = import.meta.env.VITE_NOCODB_API_TOKEN ?? '';
const TABLE_IDS_JSON = import.meta.env.VITE_NOCODB_TABLE_IDS ?? '{}';

let tableIds: Record<string, string> = {};
try {
  tableIds = JSON.parse(TABLE_IDS_JSON) as Record<string, string>;
} catch {
  console.warn('NocoDB: VITE_NOCODB_TABLE_IDS inválido');
}

function getTableId(tableName: string): string {
  const id = tableIds[tableName];
  if (!id) throw new Error(`NocoDB: Table ID não configurado para "${tableName}". Verifique VITE_NOCODB_TABLE_IDS.`);
  return id;
}

/** Verifica se uma tabela está configurada (ex.: kitchen_orders opcional). */
export function nocodbHasTable(tableName: string): boolean {
  return Boolean(tableIds[tableName]);
}

function headers(): HeadersInit {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (API_TOKEN) h['xc-token'] = API_TOKEN;
  return h;
}

/** Absolute when VITE_NOCODB_URL is set; same-origin path for the local demo. */
function requestUrl(path: string, params?: Record<string, string | undefined>): string {
  const url = new URL(path, BASE_URL || 'http://127.0.0.1');
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }
  }
  if (!BASE_URL) return `${url.pathname}${url.search}`;
  return url.toString();
}

/** Resposta da API de listagem NocoDB v2 */
interface ListResponse<T = Record<string, unknown>> {
  list?: T[];
  record?: T[];
}

function getList<T>(resp: ListResponse<T>): T[] {
  if (Array.isArray(resp.list)) return resp.list;
  if (Array.isArray(resp.record)) return resp.record;
  return [];
}

/**
 * Lista registros com filtro e ordenação opcionais.
 * where: formato NocoDB, ex. "(email,eq,foo@bar.com)" ou "(id,eq,uuid)"
 */
export async function nocodbList<T = Record<string, unknown>>(
  tableName: string,
  options?: { where?: string; sort?: string; limit?: number; offset?: number; fields?: string }
): Promise<T[]> {
  const tableId = getTableId(tableName);
  const url = requestUrl(`/api/v2/tables/${tableId}/records`, {
    where: options?.where,
    sort: options?.sort,
    limit: options?.limit != null ? String(options.limit) : undefined,
    offset: options?.offset != null ? String(options.offset) : undefined,
    fields: options?.fields,
  });

  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`NocoDB ${tableName} list: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as ListResponse<T>;
  return getList(data);
}

/**
 * Retorna um único registro por ID (busca por coluna id).
 * NocoDB pode usar Record ID numérico; aqui assumimos coluna "id" (UUID) se existir.
 */
export async function nocodbGetById<T = Record<string, unknown>>(tableName: string, id: string): Promise<T | null> {
  const list = await nocodbList<T>(tableName, { where: `(id,eq,${id})`, limit: 1 });
  return list[0] ?? null;
}

/**
 * Cria um registro. Retorna o objeto criado (a API pode devolver o record no body).
 */
export async function nocodbCreate<T = Record<string, unknown>>(
  tableName: string,
  payload: Record<string, unknown>
): Promise<T> {
  const tableId = getTableId(tableName);
  const res = await fetch(requestUrl(`/api/v2/tables/${tableId}/records`), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`NocoDB ${tableName} create: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { record?: T; recordList?: T[] } & T;
  if (data.record) return data.record as T;
  if (Array.isArray(data.recordList) && data.recordList[0]) return data.recordList[0];
  return data as T;
}

/**
 * Atualiza um registro. NocoDB v2 usa PATCH em /records/:recordId.
 * recordId pode ser o valor da coluna "id" (UUID) dependendo da configuração da tabela.
 */
export async function nocodbUpdate<T = Record<string, unknown>>(
  tableName: string,
  recordId: string,
  payload: Record<string, unknown>
): Promise<T> {
  const tableId = getTableId(tableName);
  const res = await fetch(requestUrl(`/api/v2/tables/${tableId}/records/${encodeURIComponent(recordId)}`), {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`NocoDB ${tableName} update: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { record?: T } & T;
  return (data.record ?? data) as T;
}

/**
 * Remove um registro por ID (coluna id).
 */
export async function nocodbDelete(tableName: string, recordId: string): Promise<void> {
  const tableId = getTableId(tableName);
  const res = await fetch(requestUrl(`/api/v2/tables/${tableId}/records/${encodeURIComponent(recordId)}`), {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error(`NocoDB ${tableName} delete: ${res.status} ${await res.text()}`);
}

/** Helpers para construir where (eq) */
export function whereEq(column: string, value: string | number | boolean): string {
  if (typeof value === 'string') return `(${column},eq,${value})`;
  return `(${column},eq,${value})`;
}

export function whereAnd(...conditions: string[]): string {
  if (conditions.length === 0) return '';
  if (conditions.length === 1) return conditions[0];
  return conditions.map(c => `(${c})`).join('~and');
}
