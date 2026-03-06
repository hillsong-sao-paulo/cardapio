import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { nocodbList } from '../lib/nocodb-server';

const ADMIN_TABLE = 'admin_users';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: 'email e password são obrigatórios' });
    }

    const list = await nocodbList<{ id: string; email: string; password_hash: string; name: string | null; created_at: string; is_active?: boolean }>(
      ADMIN_TABLE,
      { where: `(email,eq,${email})`, limit: 1 }
    );
    const admin = list[0];
    if (!admin) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    if (admin.is_active === false) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    return res.status(200).json({
      user: {
        id: admin.id,
        name: admin.name ?? 'Admin',
        email: admin.email,
        created_at: admin.created_at,
      },
    });
  } catch (e) {
    console.error('signin error', e);
    return res.status(500).json({ error: 'Erro na autenticação' });
  }
}
