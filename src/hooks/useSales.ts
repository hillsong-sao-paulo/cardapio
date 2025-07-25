
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleWithItems } from '@/types/database';

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
      // Usar a função do banco de dados para processar a venda com controle de estoque
      const { data, error } = await supabase.rpc('process_sale_with_stock_control', {
        sale_total: saleData.total,
        sale_items: saleData.items
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar queries para atualizar os dados
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
