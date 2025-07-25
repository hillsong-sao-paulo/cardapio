
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AdminSession {
  email: string;
  loginTime: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se existe sessão admin no localStorage
    const adminSession = localStorage.getItem('admin_session');
    
    if (adminSession) {
      try {
        const sessionData = JSON.parse(adminSession);
        setUser(sessionData);
      } catch (error) {
        console.error('Erro ao parsear sessão admin:', error);
        localStorage.removeItem('admin_session');
      }
    }
    
    setLoading(false);
  }, []);

  const signOut = async () => {
    localStorage.removeItem('admin_session');
    setUser(null);
    navigate('/auth');
    return { error: null };
  };

  return {
    user,
    session: user ? { user } : null,
    loading,
    signOut
  };
};
