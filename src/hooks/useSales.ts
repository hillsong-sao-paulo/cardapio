import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  nocodbList,
  nocodbCreate,
  nocodbUpdate,
  nocodbDelete,
  nocodbGetById,
  nocodbHasTable,
} from '@/lib/nocodb';
import { Sale, SaleWithItems, SaleItem, MenuItem } from '@/types/database';

export const useSales = () => {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const [sales, saleItems, menuItems] = await Promise.all([
        nocodbList<Sale>('sales', { sort: '-created_at' }),
        nocodbList<SaleItem>('sale_items', {}),
        nocodbList<MenuItem>('menu_items', {}),
      ]);
      const menuMap = new Map(menuItems.map((m) => [m.id, m]));
      const itemsBySale = new Map<string, (SaleItem & { menu_item: MenuItem })[]>();
      for (const si of saleItems) {
        const list = itemsBySale.get(si.sale_id) ?? [];
        list.push({ ...si, menu_item: menuMap.get(si.menu_item_id)! });
        itemsBySale.set(si.sale_id, list);
      }
      const withItems: SaleWithItems[] = sales.map((s) => ({
        ...s,
        sale_items: (itemsBySale.get(s.id) ?? []).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      }));
      return withItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
      const saleId = crypto.randomUUID();
      const sale = await nocodbCreate<Sale>('sales', { id: saleId, total: saleData.total });
      const saleItems = saleData.items.map((item) => ({
        id: crypto.randomUUID(),
        sale_id: sale.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }));
      for (const item of saleItems) {
        await nocodbCreate('sale_items', item);
      }

      for (const item of saleData.items) {
        const currentItem = await nocodbGetById<{ stock: number }>('menu_items', item.menu_item_id);
        if (!currentItem) throw new Error('Item do cardápio não encontrado');
        if (currentItem.stock < item.quantity) {
          throw new Error(
            `Estoque insuficiente para o item. Disponível: ${currentItem.stock}, Solicitado: ${item.quantity}`
          );
        }
        const newStock = currentItem.stock - item.quantity;
        await nocodbUpdate('menu_items', item.menu_item_id, {
          stock: newStock,
          updated_at: new Date().toISOString(),
        });
      }

      if (nocodbHasTable('kitchen_orders')) {
        try {
          const menuItemIds = saleData.items.map((i) => i.menu_item_id);
          const menuItems = await Promise.all(
            menuItemIds.map((id) => nocodbGetById<{ id: string; name: string }>('menu_items', id))
          );
          const menuMap = new Map(menuItems.filter(Boolean).map((m) => [m!.id, m!]));
          const kitchenOrderItems = saleData.items.map((item) => ({
            menu_item_id: item.menu_item_id,
            menu_item_name: menuMap.get(item.menu_item_id)?.name ?? 'Item não encontrado',
            quantity: item.quantity,
          }));
          const totalItems = saleData.items.reduce((sum, item) => sum + item.quantity, 0);
          const existing = await nocodbList<{ order_number?: number }>('kitchen_orders', { limit: 1000 });
          const maxNum = existing.length ? Math.max(...existing.map((o) => o.order_number ?? 0)) : 0;
          const koId = crypto.randomUUID();
          const kitchenOrder = await nocodbCreate('kitchen_orders', {
            id: koId,
            sale_id: sale.id,
            total_items: totalItems,
            status: 'new',
            order_number: maxNum + 1,
          });
          for (const ki of kitchenOrderItems) {
            await nocodbCreate('kitchen_order_items', {
              id: crypto.randomUUID(),
              kitchen_order_id: kitchenOrder.id,
              menu_item_id: ki.menu_item_id,
              menu_item_name: ki.menu_item_name,
              quantity: ki.quantity,
            });
          }
        } catch (kitchenError) {
          console.error('Erro ao criar pedido da cozinha:', kitchenError);
        }
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
      await nocodbDelete('sales', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
};
