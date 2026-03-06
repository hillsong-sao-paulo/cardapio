import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nocodbList, nocodbCreate, nocodbUpdate, nocodbHasTable } from '@/lib/nocodb';
import { KitchenOrder, KitchenOrderWithItems, KitchenOrderItem } from '@/types/database';
import type { MenuItem } from '@/types/database';

export const useKitchenOrders = () => {
  return useQuery({
    queryKey: ['kitchen_orders'],
    queryFn: async () => {
      if (!nocodbHasTable('kitchen_orders')) return [];
      const [orders, orderItems, menuItems] = await Promise.all([
        nocodbList<KitchenOrder>('kitchen_orders', { sort: 'created_at' }),
        nocodbList<KitchenOrderItem>('kitchen_order_items', {}),
        nocodbList<MenuItem>('menu_items', {}),
      ]);
      const menuMap = new Map(menuItems.map((m) => [m.id, m]));
      const itemsByOrder = new Map<string, KitchenOrderItem[]>();
      for (const oi of orderItems) {
        const kid = oi.kitchen_order_id;
        if (!kid) continue;
        const list = itemsByOrder.get(kid) ?? [];
        list.push({ ...oi, menu_item: oi.menu_item_id ? menuMap.get(oi.menu_item_id) : undefined });
        itemsByOrder.set(kid, list);
      }
      const withItems: KitchenOrderWithItems[] = orders.map((o) => ({
        ...o,
        kitchen_order_items: itemsByOrder.get(o.id) ?? [],
      }));
      return withItems;
    },
    refetchInterval: 5000,
  });
};

export const useUpdateKitchenOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'new' | 'ready' }) => {
      await nocodbUpdate('kitchen_orders', id, {
        status,
        ...(status === 'ready' ? { ready_at: new Date().toISOString() } : {}),
      });
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
      items: Array<{ menu_item_id: string; menu_item_name: string; quantity: number }>;
    }) => {
      if (!nocodbHasTable('kitchen_orders')) {
        throw new Error('Tabela kitchen_orders não configurada. Adicione em VITE_NOCODB_TABLE_IDS.');
      }
      const existing = await nocodbList<{ order_number?: number }>('kitchen_orders', { limit: 1000 });
      const maxNum = existing.length ? Math.max(...existing.map((o) => o.order_number ?? 0)) : 0;
      const order_number = maxNum + 1;
      const kitchenOrderId = crypto.randomUUID();
      const kitchenOrder = await nocodbCreate<KitchenOrder>('kitchen_orders', {
        id: kitchenOrderId,
        sale_id: orderData.sale_id,
        total_items: orderData.total_items,
        status: 'new',
        order_number,
      });
      const orderItems = orderData.items.map((item) => ({
        id: crypto.randomUUID(),
        kitchen_order_id: kitchenOrder.id,
        menu_item_id: item.menu_item_id,
        menu_item_name: item.menu_item_name,
        quantity: item.quantity,
      }));
      for (const item of orderItems) {
        await nocodbCreate('kitchen_order_items', item);
      }
      return kitchenOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen_orders'] });
    },
  });
};
