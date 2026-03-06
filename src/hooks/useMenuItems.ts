import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nocodbList, nocodbCreate, nocodbUpdate, nocodbDelete } from '@/lib/nocodb';
import { MenuItem, MenuItemWithCategory } from '@/types/database';
import type { Category } from '@/types/database';

export const useMenuItems = () => {
  return useQuery({
    queryKey: ['menu_items'],
    queryFn: async () => {
      const [items, categories] = await Promise.all([
        nocodbList<MenuItem>('menu_items', { sort: 'name' }),
        nocodbList<Category>('categories', {}),
      ]);
      const catMap = new Map(categories.map((c) => [c.id, c]));
      const withCategory: MenuItemWithCategory[] = items.map((item) => ({
        ...item,
        category: item.category_id ? catMap.get(item.category_id) : undefined,
      }));
      return withCategory;
    },
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (menuItem: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => {
      const created = await nocodbCreate<MenuItem>('menu_items', menuItem);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MenuItem> & { id: string }) => {
      const { id: _id, ...rest } = updates as Partial<MenuItem>;
      const payload = { ...rest, updated_at: new Date().toISOString() };
      const updated = await nocodbUpdate<MenuItem>('menu_items', id, payload);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await nocodbDelete('menu_items', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });
};
