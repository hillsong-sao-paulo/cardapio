import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '@/lib/api';
import { toUserError } from '@/lib/numbers';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

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

const SESSION_KEY = 'admin_session';

async function loadSupabaseUser(userId: string, email: string): Promise<AdminUser | null> {
  const { data: memberships, error: membershipError } = await getSupabase()
    .from('campus_memberships')
    .select('id')
    .limit(1);
  if (membershipError) throw new Error(membershipError.message);
  if (!memberships?.length) return null;

  const { data: profile, error: profileError } = await getSupabase()
    .from('profiles')
    .select('id, name, email, created_at')
    .eq('id', userId)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);

  return {
    id: userId,
    name: profile?.name || 'Admin',
    email: profile?.email || email,
    created_at: profile?.created_at || new Date().toISOString(),
  };
}

export const useAuth = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const adminSession = localStorage.getItem(SESSION_KEY);
      if (adminSession) {
        try {
          const sessionData: AdminSession = JSON.parse(adminSession);
          setUser(sessionData.user);
        } catch (error) {
          console.error('Could not read the admin session', error);
          localStorage.removeItem(SESSION_KEY);
        }
      }
      setLoading(false);
      return;
    }

    let active = true;
    const supabase = getSupabase();

    const applySession = async (sessionUser: { id: string; email?: string | null } | null) => {
      if (!sessionUser) {
        if (active) setUser(null);
        return;
      }
      const profile = await loadSupabaseUser(sessionUser.id, sessionUser.email ?? '');
      if (!profile) {
        await supabase.auth.signOut();
        if (active) setUser(null);
        return;
      }
      if (active) setUser(profile);
    };

    supabase.auth.getSession().then(async ({ data }) => {
      try {
        await applySession(data.session?.user ?? null);
      } catch (error) {
        console.error('Could not restore the admin session', error);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        void applySession(session?.user ?? null).catch((error) => {
          console.error('Could not refresh the admin session', error);
        });
      }, 0);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      if (isSupabaseConfigured) {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw toUserError(error, 'Credenciais inválidas');
        const signedIn = data.user;
        if (!signedIn) throw new Error('Credenciais inválidas');
        const profile = await loadSupabaseUser(signedIn.id, signedIn.email ?? email);
        if (!profile) {
          await supabase.auth.signOut();
          throw new Error('Esta conta não administra um campus.');
        }
        setUser(profile);
        return { error: null };
      }

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
      localStorage.setItem(SESSION_KEY, JSON.stringify(adminSession));
      setUser(adminUser);
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await getSupabase().auth.signOut();
      sessionStorage.removeItem('canteen-admin-store-id');
    }
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    navigate('/auth');
    return { error: null };
  };

  const updateUser = (updatedUser: AdminUser) => {
    setUser(updatedUser);
    if (!isSupabaseConfigured) {
      const adminSession: AdminSession = {
        user: updatedUser,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(adminSession));
    }
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
