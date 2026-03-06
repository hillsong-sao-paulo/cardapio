import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiUrl } from '@/lib/api';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface UpdateProfileParams {
  name: string;
  email: string;
}

interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

export const useProfile = () => {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const res = await fetch(apiUrl(`/api/auth/profile?userId=${encodeURIComponent(user.id)}`));
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Perfil não encontrado');
      }
      return res.json() as Promise<ProfileData>;
    },
    enabled: !!user?.id,
  });

  return {
    profile,
    isLoading,
  };
};

export const useUpdateProfile = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateProfileParams) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const res = await fetch(apiUrl('/api/auth/profile'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name: params.name, email: params.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Falha ao atualizar perfil');
      return data;
    },
    onSuccess: (_, params) => {
      if (user) {
        updateUser({ ...user, name: params.name, email: params.email });
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useChangePassword = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: ChangePasswordParams) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const res = await fetch(apiUrl('/api/auth/change-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: params.currentPassword,
          newPassword: params.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Falha ao alterar senha');
      return data;
    },
  });
};
