import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nocodbUpdate } from '@/lib/nocodb';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

interface BulkStockUpdate {
  id: string;
  stock: number;
}

export const useBulkUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: BulkStockUpdate[]) => {
      if (isSupabaseConfigured) {
        const supabase = getSupabase();
        await Promise.all(
          updates.map(async (update) => {
            const { error } = await supabase
              .from('menu_items')
              .update({ stock: update.stock })
              .eq('id', update.id);
            if (error) throw new Error(error.message);
          }),
        );
        return;
      }
      await Promise.all(
        updates.map((update) =>
          nocodbUpdate('menu_items', update.id, {
            stock: update.stock,
            updated_at: new Date().toISOString(),
          }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
      queryClient.invalidateQueries({ queryKey: ['public-menu'] });
    },
  });
};
