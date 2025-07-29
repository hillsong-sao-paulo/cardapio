
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KitchenOrder, KitchenOrderWithItems } from '@/types/database';

export const useKitchenOrders = () => {
  return useQuery({
    queryKey: ['kitchen_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kitchen_orders')
        .select(`
          *,
          kitchen_order_items (
            *,
            menu_item:menu_items (*)
          )
        `)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as KitchenOrderWithItems[];
    },
    refetchInterval: 5000, // Auto refresh a cada 5 segundos
  });
};

export const useUpdateKitchenOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'new' | 'ready' }) => {
      const { error } = await supabase
        .from('kitchen_orders')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen_orders'] });
    },
  });
};

export const useCreateKitchenOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData: {
      sale_id: string;
      total_items: number;
      items: Array<{
        menu_item_id: string;
        menu_item_name: string;
        quantity: number;
      }>;
    }) => {
      // Criar o pedido da cozinha (order_number é gerado automaticamente pelo trigger)
      const { data: kitchenOrder, error: orderError } = await supabase
        .from('kitchen_orders')
        .insert({ 
          sale_id: orderData.sale_id,
          total_items: orderData.total_items 
        })
        .select()
        .single();
      
      if (orderError) throw orderError;

      // Criar itens do pedido
      const orderItems = orderData.items.map(item => ({
        kitchen_order_id: kitchenOrder.id,
        menu_item_id: item.menu_item_id,
        menu_item_name: item.menu_item_name,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('kitchen_order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;

      return kitchenOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen_orders'] });
    },
  });
};
