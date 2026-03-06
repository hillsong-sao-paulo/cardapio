import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nocodbList, nocodbCreate, nocodbUpdate, nocodbDelete } from '@/lib/nocodb';
import { Category } from '@/types/database';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await nocodbList<Category>('categories', { sort: 'name' });
      return data;
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
      const created = await nocodbCreate<Category>('categories', {
        name: category.name,
        ...(category.description != null && { description: category.description }),
      });
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name: string; description?: string }) => {
      const updated = await nocodbUpdate<Category>('categories', id, {
        name: updates.name,
        ...(updates.description != null && { description: updates.description }),
        updated_at: new Date().toISOString(),
      });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await nocodbDelete('categories', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
