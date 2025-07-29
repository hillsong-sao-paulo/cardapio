
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleWithItems, SaleItem, MenuItem } from '@/types/database';
import { useCreateKitchenOrder } from './useKitchenOrders';

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

      // Update stock for each item - CORRIGIDO: subtrair quantidade do estoque atual
      for (const item of saleData.items) {
        // Primeiro, buscar o estoque atual
        const { data: currentItem, error: fetchError } = await supabase
          .from('menu_items')
          .select('stock')
          .eq('id', item.menu_item_id)
          .single();
        
        if (fetchError) throw fetchError;

        // Verificar se há estoque suficiente
        if (currentItem.stock < item.quantity) {
          throw new Error(`Estoque insuficiente para o item. Disponível: ${currentItem.stock}, Solicitado: ${item.quantity}`);
        }

        // Subtrair a quantidade vendida do estoque atual
        const newStock = currentItem.stock - item.quantity;
        
        const { error: stockError } = await supabase
          .from('menu_items')
          .update({ 
            stock: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.menu_item_id);
        
        if (stockError) throw stockError;
      }

      // Criar pedido na cozinha automaticamente
      try {
        // Buscar nomes dos itens para o pedido da cozinha
        const menuItemIds = saleData.items.map(item => item.menu_item_id);
        const { data: menuItems, error: menuError } = await supabase
          .from('menu_items')
          .select('id, name')
          .in('id', menuItemIds);
        
        if (menuError) throw menuError;

        // Preparar dados do pedido da cozinha
        const kitchenOrderItems = saleData.items.map(item => {
          const menuItem = menuItems.find(mi => mi.id === item.menu_item_id);
          return {
            menu_item_id: item.menu_item_id,
            menu_item_name: menuItem?.name || 'Item não encontrado',
            quantity: item.quantity,
          };
        });

        const totalItems = saleData.items.reduce((sum, item) => sum + item.quantity, 0);

        // Criar pedido da cozinha
        const { data: kitchenOrder, error: kitchenError } = await supabase
          .from('kitchen_orders')
          .insert([{ 
            sale_id: sale.id,
            total_items: totalItems 
          }])
          .select()
          .single();
        
        if (kitchenError) throw kitchenError;

        // Criar itens do pedido da cozinha
        const kitchenOrderItemsData = kitchenOrderItems.map(item => ({
          kitchen_order_id: kitchenOrder.id,
          menu_item_id: item.menu_item_id,
          menu_item_name: item.menu_item_name,
          quantity: item.quantity,
        }));

        const { error: kitchenItemsError } = await supabase
          .from('kitchen_order_items')
          .insert(kitchenOrderItemsData);
        
        if (kitchenItemsError) throw kitchenItemsError;

        console.log('Pedido da cozinha criado automaticamente:', kitchenOrder);
      } catch (kitchenError) {
        console.error('Erro ao criar pedido da cozinha:', kitchenError);
        // Não falha a venda por causa do erro na cozinha
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen_orders'] });
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
