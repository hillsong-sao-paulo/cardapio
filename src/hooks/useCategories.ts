import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nocodbCreate, nocodbDelete, nocodbList, nocodbUpdate } from '@/lib/nocodb';
import { fetchAdminCategories } from '@/lib/canteen-api';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { useOptionalAdminStore } from '@/context/admin-store';
import { usePublicMenu } from '@/hooks/useStoreName';
import { Category } from '@/types/database';

export const useCategories = () => {
  const { slug } = useParams();
  const admin = useOptionalAdminStore();
  const publicMenu = usePublicMenu(isSupabaseConfigured ? slug : undefined);
  const storeId = admin?.storeId ?? null;
  const publicMode = isSupabaseConfigured && Boolean(slug);

  const stored = useQuery({
    queryKey: isSupabaseConfigured ? ['categories', storeId] : ['categories'],
    enabled: !publicMode && (!isSupabaseConfigured || Boolean(storeId)),
    queryFn: async () => {
      if (isSupabaseConfigured && storeId) {
        return fetchAdminCategories(storeId);
      }
      return nocodbList<Category>('categories', { sort: 'name' });
    },
  });

  if (publicMode) {
    return {
      ...publicMenu,
      data: publicMenu.data?.categories,
    };
  }

  return stored;
};

function requireStoreId(storeId: string | null | undefined): string {
  if (!storeId) throw new Error('Select a store first');
  return storeId;
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const admin = useOptionalAdminStore();
  return useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
      if (isSupabaseConfigured) {
        const storeId = requireStoreId(admin?.storeId);
        const { data, error } = await getSupabase()
          .from('categories')
          .insert({
            name: category.name,
            description: category.description ?? null,
            store_id: storeId,
          })
          .select('*')
          .single();
        if (error) throw new Error(error.message);
        return data as Category;
      }
      return nocodbCreate<Category>('categories', {
        name: category.name,
        ...(category.description != null && { description: category.description }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['public-menu'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name: string; description?: string }) => {
      if (isSupabaseConfigured) {
        const { data, error } = await getSupabase()
          .from('categories')
          .update({
            name: updates.name,
            ...(updates.description != null && { description: updates.description }),
          })
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw new Error(error.message);
        return data as Category;
      }
      return nocodbUpdate<Category>('categories', id, {
        name: updates.name,
        ...(updates.description != null && { description: updates.description }),
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['public-menu'] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isSupabaseConfigured) {
        const { error } = await getSupabase().from('categories').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return;
      }
      await nocodbDelete('categories', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['public-menu'] });
    },
  });
};
