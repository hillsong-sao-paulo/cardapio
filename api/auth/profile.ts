import type { VercelRequest, VercelResponse } from '@vercel/node';
import { nocodbList, nocodbUpdate } from '../lib/nocodb-server';

const ADMIN_TABLE = 'admin_users';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }
    try {
      const list = await nocodbList<{ id: string; name: string | null; email: string; created_at: string }>(
        ADMIN_TABLE,
        { where: `(id,eq,${userId})`, limit: 1 }
      );
      const admin = list[0];
      if (!admin) {
        return res.status(404).json({ error: 'Perfil não encontrado' });
      }
      return res.status(200).json({
        id: admin.id,
        name: admin.name ?? 'Admin',
        email: admin.email,
        created_at: admin.created_at,
      });
    } catch (e) {
      console.error('profile GET error', e);
      return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  }

  if (req.method === 'PATCH') {
    const { userId, name, email } = req.body as { userId?: string; name?: string; email?: string };
    if (!userId || !name || !email) {
      return res.status(400).json({ error: 'userId, name e email são obrigatórios' });
    }
    try {
      const list = await nocodbList<{ id: string }>(ADMIN_TABLE, {
        where: `(email,eq,${email})`,
        limit: 2,
      });
      const sameEmail = list.find((r) => r.id !== userId);
      if (sameEmail) {
        return res.status(400).json({ error: 'Email já está em uso por outro usuário' });
      }
      await nocodbUpdate(ADMIN_TABLE, userId, { name, email, updated_at: new Date().toISOString() });
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('profile PATCH error', e);
      return res.status(500).json({ error: 'Falha ao atualizar perfil' });
    }
  }

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
}
