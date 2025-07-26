
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem } from '@/types/database';

interface BulkStockUpdate {
  id: string;
  stock: number;
}

export const useBulkUpdateStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: BulkStockUpdate[]) => {
      const promises = updates.map(update => 
        supabase
          .from('menu_items')
          .update({ 
            stock: update.stock, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', update.id)
      );
      
      const results = await Promise.all(promises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} items`);
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });
};
