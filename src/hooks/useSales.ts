
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleItem, SaleWithItems } from '@/types/database';

export const useSales = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['sales', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select(`
          *,
          sale_items(
            *,
            menu_item:menu_items(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as SaleWithItems[];
    },
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sale: { total: number; items: Omit<SaleItem, 'id' | 'sale_id' | 'created_at'>[] }) => {
      // Criar a venda
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{ total: sale.total }])
        .select()
        .single();
      
      if (saleError) throw saleError;

      // Criar os itens da venda
      const saleItems = sale.items.map(item => ({
        ...item,
        sale_id: saleData.id
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);
      
      if (itemsError) throw itemsError;

      // Atualizar estoque dos itens
      for (const item of sale.items) {
        const { error: stockError } = await supabase.rpc('update_stock', {
          item_id: item.menu_item_id,
          quantity_sold: item.quantity
        });
        
        if (stockError) {
          // Fallback: atualizar manualmente
          const { data: currentItem } = await supabase
            .from('menu_items')
            .select('stock')
            .eq('id', item.menu_item_id)
            .single();
          
          if (currentItem) {
            await supabase
              .from('menu_items')
              .update({ stock: currentItem.stock - item.quantity })
              .eq('id', item.menu_item_id);
          }
        }
      }

      return saleData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });
};
