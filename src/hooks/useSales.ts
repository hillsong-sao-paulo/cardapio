
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleWithItems, SaleItem, MenuItem } from '@/types/database';

export const useSales = () => {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            *,
            menu_item:menu_items (*)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SaleWithItems[];
    },
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (saleData: {
      total: number;
      items: Array<{
        menu_item_id: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
      }>;
    }) => {
      // Create the sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{ total: saleData.total }])
        .select()
        .single();
      
      if (saleError) throw saleError;

      // Create sale items
      const saleItems = saleData.items.map(item => ({
        sale_id: sale.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);
      
      if (itemsError) throw itemsError;

      // Update stock for each item
      for (const item of saleData.items) {
        const { error: stockError } = await supabase
          .from('menu_items')
          .update({ 
            stock: supabase.raw(`stock - ${item.quantity}`),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.menu_item_id);
        
        if (stockError) throw stockError;
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });
};

export const useDeleteSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
};
