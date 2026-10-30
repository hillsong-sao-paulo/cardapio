import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nocodbCreate, nocodbDelete, nocodbList, nocodbUpdate } from '@/lib/nocodb';
import { fetchAdminMenu } from '@/lib/canteen-api';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { useOptionalAdminStore } from '@/context/admin-store';
import { usePublicMenu } from '@/hooks/useStoreName';
import { MenuItem, MenuItemWithCategory } from '@/types/database';
import type { Category } from '@/types/database';

export const useMenuItems = () => {
  const { slug } = useParams();
  const admin = useOptionalAdminStore();
  const publicMenu = usePublicMenu(isSupabaseConfigured ? slug : undefined);
  const storeId = admin?.storeId ?? null;
  const publicMode = isSupabaseConfigured && Boolean(slug);

  const stored = useQuery({
    queryKey: isSupabaseConfigured ? ['menu_items', storeId] : ['menu_items'],
    enabled: !publicMode && (!isSupabaseConfigured || Boolean(storeId)),
    queryFn: async () => {
      if (isSupabaseConfigured && storeId) {
        return fetchAdminMenu(storeId);
      }
      const [items, categories] = await Promise.all([
        nocodbList<MenuItem>('menu_items', { sort: 'name' }),
        nocodbList<Category>('categories', {}),
      ]);
      const catMap = new Map(categories.map((category) => [category.id, category]));
      const withCategory: MenuItemWithCategory[] = items.map((item) => ({
        ...item,
        category: item.category_id ? catMap.get(item.category_id) : undefined,
      }));
      return withCategory;
    },
  });

  if (publicMode) {
    return {
      ...publicMenu,
      data: publicMenu.data?.items,
    };
  }

  return stored;
};

function requireStoreId(storeId: string | null | undefined): string {
  if (!storeId) throw new Error('Select a store first');
  return storeId;
}

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  const admin = useOptionalAdminStore();
  return useMutation({
    mutationFn: async (menuItem: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => {
      if (isSupabaseConfigured) {
        const storeId = requireStoreId(admin?.storeId);
        const { data, error } = await getSupabase()
          .from('menu_items')
          .insert({ ...menuItem, store_id: storeId })
          .select('*')
          .single();
        if (error) throw new Error(error.message);
        return data as MenuItem;
      }
      return nocodbCreate<MenuItem>('menu_items', menuItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
      queryClient.invalidateQueries({ queryKey: ['public-menu'] });
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MenuItem> & { id: string }) => {
      const { id: _ignored, ...rest } = updates as Partial<MenuItem> & { id?: string };
      if (isSupabaseConfigured) {
        const { data, error } = await getSupabase()
          .from('menu_items')
          .update(rest)
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw new Error(error.message);
        return data as MenuItem;
      }
      return nocodbUpdate<MenuItem>('menu_items', id, {
        ...rest,
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
      queryClient.invalidateQueries({ queryKey: ['public-menu'] });
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isSupabaseConfigured) {
        const { error } = await getSupabase().from('menu_items').delete().eq('id', id);
        if (error) {
          const detail = `${error.message} ${error.details ?? ''} ${error.code ?? ''}`;
          const blockedBySale = error.code === '23503' && detail.includes('sale_items');
          if (blockedBySale) throw new Error('ITEM_HAS_SALES');
          throw new Error(error.message);
        }
        return;
      }
      await nocodbDelete('menu_items', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
      queryClient.invalidateQueries({ queryKey: ['public-menu'] });
    },
  });
};
