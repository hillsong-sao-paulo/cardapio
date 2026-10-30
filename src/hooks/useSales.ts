import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  nocodbCreate,
  nocodbDelete,
  nocodbGetById,
  nocodbHasTable,
  nocodbList,
  nocodbUpdate,
} from '@/lib/nocodb';
import { createPublicSale, fetchAdminSales } from '@/lib/canteen-api';
import { toUserError } from '@/lib/numbers';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { useOptionalAdminStore } from '@/context/admin-store';
import { Sale, SaleItem, SaleWithItems, MenuItem } from '@/types/database';

export const useSales = () => {
  const admin = useOptionalAdminStore();
  const storeId = admin?.storeId ?? null;

  return useQuery({
    queryKey: isSupabaseConfigured ? ['sales', storeId] : ['sales'],
    enabled: !isSupabaseConfigured || Boolean(storeId),
    queryFn: async () => {
      if (isSupabaseConfigured && storeId) {
        return fetchAdminSales(storeId);
      }
      const [sales, saleItems, menuItems] = await Promise.all([
        nocodbList<Sale>('sales', { sort: '-created_at' }),
        nocodbList<SaleItem>('sale_items', {}),
        nocodbList<MenuItem>('menu_items', {}),
      ]);
      const menuMap = new Map(menuItems.map((item) => [item.id, item]));
      const itemsBySale = new Map<string, (SaleItem & { menu_item: MenuItem })[]>();
      for (const saleItem of saleItems) {
        const list = itemsBySale.get(saleItem.sale_id) ?? [];
        const menuItem = menuMap.get(saleItem.menu_item_id);
        if (!menuItem) continue;
        list.push({ ...saleItem, menu_item: menuItem });
        itemsBySale.set(saleItem.sale_id, list);
      }
      const withItems: SaleWithItems[] = sales.map((sale) => ({
        ...sale,
        sale_items: (itemsBySale.get(sale.id) ?? []).sort(
          (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
        ),
      }));
      return withItems.sort(
        (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      );
    },
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  const { slug } = useParams();

  return useMutation({
    mutationFn: async (saleData: {
      total: number;
      items: Array<{
        menu_item_id: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
        options_label?: string | null;
        drink?: string | null;
        doneness?: string | null;
        removed?: string[];
      }>;
    }) => {
      if (isSupabaseConfigured) {
        if (!slug) throw new Error('Store not found');
        try {
          const created = await createPublicSale(
            slug,
            saleData.items.map((item) => ({
              menu_item_id: item.menu_item_id,
              quantity: item.quantity,
              ...(item.drink ? { drink: item.drink } : {}),
              ...(item.doneness ? { doneness: item.doneness } : {}),
              ...(item.removed && item.removed.length > 0 ? { removed: item.removed } : {}),
            })),
          );
          return { id: created.sale_id, total: created.total } as Sale;
        } catch (error) {
          throw toUserError(error, 'Could not create the sale');
        }
      }

      const saleId = crypto.randomUUID();
      const sale = await nocodbCreate<Sale>('sales', { id: saleId, total: saleData.total });
      const saleItems = saleData.items.map((item) => ({
        id: crypto.randomUUID(),
        sale_id: sale.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        options_label: item.options_label ?? null,
      }));
      for (const item of saleItems) {
        await nocodbCreate('sale_items', item);
      }

      for (const item of saleData.items) {
        const currentItem = await nocodbGetById<{ stock: number }>('menu_items', item.menu_item_id);
        if (!currentItem) throw new Error('Item do cardápio não encontrado');
        if (currentItem.stock < item.quantity) {
          throw new Error(
            `Estoque insuficiente para o item. Disponível: ${currentItem.stock}, Solicitado: ${item.quantity}`,
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
          const menuItems = await Promise.all(
            saleData.items.map((item) =>
              nocodbGetById<{ id: string; name: string }>('menu_items', item.menu_item_id),
            ),
          );
          const menuMap = new Map(menuItems.filter(Boolean).map((item) => [item!.id, item!]));
          const totalItems = saleData.items.reduce((sum, item) => sum + item.quantity, 0);
          const existing = await nocodbList<{ order_number?: number }>('kitchen_orders', { limit: 1000 });
          const maxNum = existing.length ? Math.max(...existing.map((order) => order.order_number ?? 0)) : 0;
          const kitchenOrder = await nocodbCreate('kitchen_orders', {
            id: crypto.randomUUID(),
            sale_id: sale.id,
            total_items: totalItems,
            status: 'new',
            order_number: maxNum + 1,
          });
          for (const item of saleData.items) {
            await nocodbCreate('kitchen_order_items', {
              id: crypto.randomUUID(),
              kitchen_order_id: kitchenOrder.id,
              menu_item_id: item.menu_item_id,
              menu_item_name: menuMap.get(item.menu_item_id)?.name ?? 'Item não encontrado',
              quantity: item.quantity,
              options_label: item.options_label ?? null,
            });
          }
        } catch (kitchenError) {
          console.error('Could not create the kitchen order', kitchenError);
        }
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
      queryClient.invalidateQueries({ queryKey: ['public-menu'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen_orders'] });
    },
  });
};

export const useDeleteSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isSupabaseConfigured) {
        const { error } = await getSupabase().from('sales').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return;
      }
      await nocodbDelete('sales', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
};
