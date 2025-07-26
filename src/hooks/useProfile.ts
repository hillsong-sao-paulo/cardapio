
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('get_admin_profile', {
        user_id: user.id
      });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Perfil não encontrado');

      return data[0] as ProfileData;
    },
    enabled: !!user?.id,
  });

  return {
    profile,
    isLoading
  };
};

export const useUpdateProfile = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateProfileParams) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('update_admin_profile', {
        user_id: user.id,
        new_name: params.name,
        new_email: params.email
      });

      if (error) throw error;
      if (!data) throw new Error('Falha ao atualizar perfil');

      return data;
    },
    onSuccess: (_, params) => {
      // Atualizar o usuário na sessão
      if (user) {
        updateUser({
          ...user,
          name: params.name,
          email: params.email
        });
      }
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useChangePassword = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: ChangePasswordParams) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('change_admin_password', {
        user_id: user.id,
        current_password: params.currentPassword,
        new_password: params.newPassword
      });

      if (error) throw error;
      if (!data) throw new Error('Falha ao alterar senha');

      return data;
    },
  });
};
