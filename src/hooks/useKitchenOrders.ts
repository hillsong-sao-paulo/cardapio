import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nocodbCreate, nocodbHasTable, nocodbList, nocodbUpdate } from '@/lib/nocodb';
import { fetchAdminKitchenOrders, fetchPublicKitchenOrders, updatePublicKitchenOrder } from '@/lib/canteen-api';
import { toUserError } from '@/lib/numbers';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { useOptionalAdminStore } from '@/context/admin-store';
import { KitchenOrder, KitchenOrderItem, KitchenOrderWithItems } from '@/types/database';
import type { MenuItem } from '@/types/database';

export const useKitchenOrders = () => {
  const { slug } = useParams();
  const admin = useOptionalAdminStore();
  const storeId = admin?.storeId ?? null;
  const publicMode = isSupabaseConfigured && Boolean(slug);

  return useQuery({
    queryKey: publicMode
      ? ['kitchen_orders', 'public', slug]
      : isSupabaseConfigured
        ? ['kitchen_orders', storeId]
        : ['kitchen_orders'],
    enabled: publicMode || !isSupabaseConfigured || Boolean(storeId),
    refetchInterval: 5000,
    queryFn: async () => {
      if (publicMode && slug) {
        try {
          return await fetchPublicKitchenOrders(slug);
        } catch (error) {
          throw toUserError(error, 'Store not found');
        }
      }
      if (isSupabaseConfigured && storeId) {
        return fetchAdminKitchenOrders(storeId);
      }
      if (!nocodbHasTable('kitchen_orders')) return [];
      const [orders, orderItems, menuItems] = await Promise.all([
        nocodbList<KitchenOrder>('kitchen_orders', { sort: 'created_at' }),
        nocodbList<KitchenOrderItem>('kitchen_order_items', {}),
        nocodbList<MenuItem>('menu_items', {}),
      ]);
      const menuMap = new Map(menuItems.map((item) => [item.id, item]));
      const itemsByOrder = new Map<string, KitchenOrderItem[]>();
      for (const orderItem of orderItems) {
        const orderId = orderItem.kitchen_order_id;
        if (!orderId) continue;
        const list = itemsByOrder.get(orderId) ?? [];
        list.push({
          ...orderItem,
          menu_item: orderItem.menu_item_id ? menuMap.get(orderItem.menu_item_id) : undefined,
        });
        itemsByOrder.set(orderId, list);
      }
      const withItems: KitchenOrderWithItems[] = orders.map((order) => ({
        ...order,
        kitchen_order_items: itemsByOrder.get(order.id) ?? [],
      }));
      return withItems;
    },
  });
};

export const useUpdateKitchenOrderStatus = () => {
  const queryClient = useQueryClient();
  const { slug } = useParams();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'new' | 'ready' }) => {
      if (isSupabaseConfigured) {
        if (slug) {
          await updatePublicKitchenOrder(slug, id, status);
          return;
        }
        const { error } = await getSupabase()
          .from('kitchen_orders')
          .update({ status })
          .eq('id', id);
        if (error) throw new Error(error.message);
        return;
      }
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
      items: Array<{
        menu_item_id: string;
        menu_item_name: string;
        quantity: number;
        options_label?: string | null;
      }>;
    }) => {
      if (isSupabaseConfigured) {
        throw new Error('Kitchen orders are created with the sale');
      }
      if (!nocodbHasTable('kitchen_orders')) {
        throw new Error('Kitchen orders are not available in the local demo');
      }
      const existing = await nocodbList<{ order_number?: number }>('kitchen_orders', { limit: 1000 });
      const maxNum = existing.length ? Math.max(...existing.map((order) => order.order_number ?? 0)) : 0;
      const kitchenOrder = await nocodbCreate<KitchenOrder>('kitchen_orders', {
        id: crypto.randomUUID(),
        sale_id: orderData.sale_id,
        total_items: orderData.total_items,
        status: 'new',
        order_number: maxNum + 1,
      });
      for (const item of orderData.items) {
        await nocodbCreate('kitchen_order_items', {
          id: crypto.randomUUID(),
          kitchen_order_id: kitchenOrder.id,
          menu_item_id: item.menu_item_id,
          menu_item_name: item.menu_item_name,
          quantity: item.quantity,
          options_label: item.options_label ?? null,
        });
      }
      return kitchenOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen_orders'] });
    },
  });
};
