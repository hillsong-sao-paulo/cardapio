import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { nocodbGetById, nocodbUpdate } from '../lib/nocodb-server';

const ADMIN_TABLE = 'admin_users';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, currentPassword, newPassword } = req.body as {
      userId?: string;
      currentPassword?: string;
      newPassword?: string;
    };
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'userId, currentPassword e newPassword são obrigatórios' });
    }

    const admin = await nocodbGetById<{ id: string; password_hash: string }>(ADMIN_TABLE, userId);
    if (!admin) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const valid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await nocodbUpdate(ADMIN_TABLE, userId, { password_hash: newHash, updated_at: new Date().toISOString() });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('change-password error', e);
    return res.status(500).json({ error: 'Falha ao alterar senha' });
  }
}
