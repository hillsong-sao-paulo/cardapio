
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
    // Verificar se existe sessão admin no localStorage
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
      // Verificar credenciais usando a função do Supabase
      const { data, error } = await supabase.rpc('is_admin_user', {
        user_email: email,
        user_password: password
      });

      if (error) {
        throw new Error('Erro na autenticação');
      }

      if (!data) {
        throw new Error('Credenciais inválidas');
      }

      // Buscar dados completos do usuário
      const { data: userData, error: userError } = await supabase
        .from('admin_users')
        .select('id, name, email, created_at')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        throw new Error('Erro ao buscar dados do usuário');
      }

      const adminUser: AdminUser = {
        id: userData.id,
        name: userData.name || 'Admin',
        email: userData.email,
        created_at: userData.created_at
      };

      const adminSession: AdminSession = {
        user: adminUser,
        loginTime: new Date().toISOString()
      };

      localStorage.setItem('admin_session', JSON.stringify(adminSession));
      setUser(adminUser);

      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error : new Error('Erro desconhecido') 
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
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('admin_session', JSON.stringify(adminSession));
  };

  return {
    user,
    session: user ? { user } : null,
    loading,
    signIn,
    signOut,
    updateUser
  };
};
