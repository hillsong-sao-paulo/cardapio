import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nocodbUpdate } from '@/lib/nocodb';

interface BulkStockUpdate {
  id: string;
  stock: number;
}

export const useBulkUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: BulkStockUpdate[]) => {
      await Promise.all(
        updates.map((update) =>
          nocodbUpdate('menu_items', update.id, {
            stock: update.stock,
            updated_at: new Date().toISOString(),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });
};
