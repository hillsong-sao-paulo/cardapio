import type { IncomingMessage, ServerResponse } from 'node:http';
import bcrypt from 'bcryptjs';
import type { Plugin } from 'vite';
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  createRow,
  deleteRow,
  findAdminByEmail,
  findAdminById,
  getDatabase,
  isDemoTable,
  listRows,
  updateRow,
} from './local-demo-store';

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

async function handleAuth(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
  if (pathname === '/api/auth/signin' && req.method === 'POST') {
    const body = await readBody(req);
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      send(res, 400, { error: 'email e password são obrigatórios' });
      return true;
    }
    const admin = findAdminByEmail(email);
    const hash = typeof admin?.password_hash === 'string' ? admin.password_hash : '';
    const active = admin?.is_active !== false;
    const valid = Boolean(admin && active && hash && await bcrypt.compare(password, hash));
    if (!admin || !valid) {
      send(res, 401, { error: 'Credenciais inválidas' });
      return true;
    }
    send(res, 200, {
      user: {
        id: admin.id,
        name: admin.name ?? 'Admin',
        email: admin.email,
        created_at: admin.created_at,
      },
    });
    return true;
  }

  if (pathname === '/api/auth/profile' && req.method === 'GET') {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const userId = url.searchParams.get('userId') ?? '';
    if (!userId) {
      send(res, 400, { error: 'userId é obrigatório' });
      return true;
    }
    const admin = findAdminById(userId);
    if (!admin) {
      send(res, 404, { error: 'Perfil não encontrado' });
      return true;
    }
    send(res, 200, {
      id: admin.id,
      name: admin.name ?? 'Admin',
      email: admin.email,
      created_at: admin.created_at,
    });
    return true;
  }

  if (pathname === '/api/auth/profile' && req.method === 'PATCH') {
    const body = await readBody(req);
    const userId = typeof body.userId === 'string' ? body.userId : '';
    const name = typeof body.name === 'string' ? body.name : '';
    const email = typeof body.email === 'string' ? body.email : '';
    if (!userId || !name || !email) {
      send(res, 400, { error: 'userId, name e email são obrigatórios' });
      return true;
    }
    const sameEmail = findAdminByEmail(email);
    if (sameEmail && sameEmail.id !== userId) {
      send(res, 400, { error: 'Email já está em uso por outro usuário' });
      return true;
    }
    const updated = updateRow('admin_users', userId, { name, email });
    if (!updated) {
      send(res, 404, { error: 'Perfil não encontrado' });
      return true;
    }
    send(res, 200, { success: true });
    return true;
  }

  if (pathname === '/api/auth/change-password' && req.method === 'POST') {
    const body = await readBody(req);
    const userId = typeof body.userId === 'string' ? body.userId : '';
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    if (!userId || !currentPassword || !newPassword) {
      send(res, 400, { error: 'userId, currentPassword e newPassword são obrigatórios' });
      return true;
    }
    const admin = findAdminById(userId);
    const hash = typeof admin?.password_hash === 'string' ? admin.password_hash : '';
    if (!admin || !hash) {
      send(res, 404, { error: 'Usuário não encontrado' });
      return true;
    }
    const valid = await bcrypt.compare(currentPassword, hash);
    if (!valid) {
      send(res, 400, { error: 'Senha atual incorreta' });
      return true;
    }
    updateRow('admin_users', userId, { password_hash: bcrypt.hashSync(newPassword, 10) });
    send(res, 200, { success: true });
    return true;
  }

  return false;
}

async function handleRecords(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
  const match = pathname.match(/^\/api\/v2\/tables\/([^/]+)\/records(?:\/([^/]+))?$/);
  if (!match) return false;
  const table = decodeURIComponent(match[1]);
  const recordId = match[2] ? decodeURIComponent(match[2]) : undefined;
  if (!isDemoTable(table)) {
    send(res, 404, { error: `Tabela não encontrada: ${table}` });
    return true;
  }

  if (req.method === 'GET' && !recordId) {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    const rows = listRows(table, {
      where: url.searchParams.get('where') ?? undefined,
      sort: url.searchParams.get('sort') ?? undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    send(res, 200, { list: rows });
    return true;
  }

  if (req.method === 'POST' && !recordId) {
    const body = await readBody(req);
    send(res, 200, createRow(table, body));
    return true;
  }

  if (req.method === 'PATCH' && recordId) {
    const body = await readBody(req);
    const updated = updateRow(table, recordId, body);
    if (!updated) {
      send(res, 404, { error: 'Registro não encontrado' });
      return true;
    }
    send(res, 200, updated);
    return true;
  }

  if (req.method === 'DELETE' && recordId) {
    const removed = deleteRow(table, recordId);
    if (!removed) {
      send(res, 404, { error: 'Registro não encontrado' });
      return true;
    }
    send(res, 200, { success: true });
    return true;
  }

  send(res, 405, { error: 'Method not allowed' });
  return true;
}

/** Serves a temporary JSON database that speaks the same API as NocoDB. Dev only. */
export function localDemoPlugin(): Plugin {
  return {
    name: 'local-demo-database',
    configureServer(server) {
      const db = getDatabase();
      server.config.logger.info(
        `Local demo database ready (${db.sales.length} sales, ${db.menu_items.length} menu items). `
        + `Login: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`,
      );
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0];
        if (!pathname.startsWith('/api/')) {
          next();
          return;
        }
        try {
          const handled = await handleAuth(req, res, pathname) || await handleRecords(req, res, pathname);
          if (!handled) send(res, 404, { error: 'Not found' });
        } catch (error) {
          server.config.logger.error(error instanceof Error ? error.message : String(error));
          if (!res.headersSent) send(res, 500, { error: 'Erro no banco local' });
        }
      });
    },
  };
}
