import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '@/lib/api';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface AdminSession {
  user: AdminUser;
  loginTime: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      try {
        const sessionData: AdminSession = JSON.parse(adminSession);
        setUser(sessionData.user);
      } catch (error) {
        console.error('Erro ao parsear sessão admin:', error);
        localStorage.removeItem('admin_session');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch(apiUrl('/api/auth/signin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? 'Credenciais inválidas');
      }
      const adminUser: AdminUser = {
        id: data.user.id,
        name: data.user.name ?? 'Admin',
        email: data.user.email,
        created_at: data.user.created_at,
      };
      const adminSession: AdminSession = {
        user: adminUser,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('admin_session', JSON.stringify(adminSession));
      setUser(adminUser);
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('admin_session');
    setUser(null);
    navigate('/auth');
    return { error: null };
  };

  const updateUser = (updatedUser: AdminUser) => {
    setUser(updatedUser);
    const adminSession: AdminSession = {
      user: updatedUser,
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem('admin_session', JSON.stringify(adminSession));
  };

  return {
    user,
    session: user ? { user } : null,
    loading,
    signIn,
    signOut,
    updateUser,
  };
};
