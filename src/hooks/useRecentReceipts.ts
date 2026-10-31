import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentReceipts } from '@/lib/canteen-api';
import { nocodbList } from '@/lib/nocodb';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { OrderReceipt } from '@/types/database';

const RECEIPT_LIMIT = 30;

export function useRecentReceipts() {
  const { slug } = useParams();

  return useQuery({
    queryKey: ['recent-receipts', slug ?? 'local'],
    refetchInterval: 8000,
    queryFn: async (): Promise<OrderReceipt[]> => {
      if (isSupabaseConfigured) {
        if (!slug) return [];
        return fetchRecentReceipts(slug);
      }

      const [orders, sales] = await Promise.all([
        nocodbList<{
          order_number?: number;
          customer_name?: string | null;
          sale_id?: string | null;
          created_at?: string;
        }>('kitchen_orders', { limit: 1000 }),
        nocodbList<{ id: string; total?: number }>('sales', { limit: 1000 }),
      ]);
      const totals = new Map(sales.map((sale) => [sale.id, sale.total ?? 0]));

      return orders
        .map((order) => ({
          order_number: order.order_number ?? 0,
          customer_name: order.customer_name?.trim() || null,
          total: order.sale_id ? totals.get(order.sale_id) ?? 0 : 0,
          created_at: order.created_at ?? '',
        }))
        .filter((receipt) => receipt.order_number > 0)
        .sort((left, right) => right.order_number - left.order_number)
        .slice(0, RECEIPT_LIMIT);
    },
  });
}
