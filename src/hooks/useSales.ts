
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleItem } from '@/types/database';

export const useSales = () => {
  const queryClient = useQueryClient();

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            *,
            menu_items (
              name,
              price
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Sale & {
        sale_items: (SaleItem & {
          menu_items: {
            name: string;
            price: number;
          };
        })[];
      })[];
    },
  });

  const createSale = useMutation({
    mutationFn: async (saleData: {
      total: number;
      items: { menu_item_id: string; quantity: number; unit_price: number; subtotal: number }[];
    }) => {
      // Criar a venda
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          total: saleData.total,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Criar os itens da venda
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(
          saleData.items.map(item => ({
            sale_id: sale.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
          }))
        );

      if (itemsError) throw itemsError;

      // Atualizar o estoque dos itens
      for (const item of saleData.items) {
        const { error: stockError } = await supabase.rpc('update_menu_item_stock', {
          item_id: item.menu_item_id,
          quantity_sold: item.quantity,
        });

        if (stockError) throw stockError;
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });

  const getSalesStats = async (startDate?: string, endDate?: string) => {
    let query = supabase
      .from('sales')
      .select('total, created_at');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const totalSales = data.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalCount = data.length;

    return {
      totalSales,
      totalCount,
      averageTicket: totalCount > 0 ? totalSales / totalCount : 0,
    };
  };

  return {
    sales,
    isLoading,
    createSale,
    getSalesStats,
  };
};
