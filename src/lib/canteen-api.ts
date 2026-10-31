import { getSupabase } from '@/lib/supabase';
import { asNumber } from '@/lib/numbers';
import type {
  Category,
  KitchenOrderItem,
  KitchenOrderWithItems,
  MenuItem,
  MenuItemWithCategory,
  SaleWithItems,
} from '@/types/database';

export interface PublicMenu {
  store: { id: string; name: string; slug: string };
  categories: Category[];
  items: MenuItemWithCategory[];
}

interface PublicMenuRow {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  stock: number | string;
  category_id: string | null;
  image_url: string | null;
  option_profile?: string | null;
}

interface PublicMenuPayload {
  store: { id: string; name: string; slug: string };
  categories: Array<{ id: string; name: string; description?: string | null }>;
  menu_items: PublicMenuRow[];
}

function requireData<T>(data: T | null, error: { message: string } | null, fallback: string): T {
  if (error) throw new Error(error.message);
  if (data == null) throw new Error(fallback);
  return data;
}

function toCategory(row: {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  };
}

function toMenuItem(row: PublicMenuRow & { created_at?: string; updated_at?: string }): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: asNumber(row.price),
    stock: asNumber(row.stock),
    category_id: row.category_id,
    image_url: row.image_url,
    option_profile: row.option_profile ?? null,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  };
}

export async function fetchPublicMenu(slug: string): Promise<PublicMenu> {
  const { data, error } = await getSupabase().rpc('read_menu', { store_slug: slug });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Store not found');

  const payload = data as PublicMenuPayload;
  const categories = (payload.categories ?? []).map((category) => toCategory(category));
  const byId = new Map(categories.map((category) => [category.id, category]));
  const items = (payload.menu_items ?? []).map((row) => ({
    ...toMenuItem(row),
    category: row.category_id ? byId.get(row.category_id) : undefined,
  }));

  return { store: payload.store, categories, items };
}

export async function fetchAdminMenu(storeId: string): Promise<MenuItemWithCategory[]> {
  const supabase = getSupabase();
  const [itemsResult, categoriesResult] = await Promise.all([
    supabase.from('menu_items').select('*').eq('store_id', storeId).order('name'),
    supabase.from('categories').select('*').eq('store_id', storeId).order('name'),
  ]);
  if (itemsResult.error) throw new Error(itemsResult.error.message);
  if (categoriesResult.error) throw new Error(categoriesResult.error.message);

  const categories = ((categoriesResult.data ?? []) as Category[]).map((category) => toCategory(category));
  const byId = new Map(categories.map((category) => [category.id, category]));
  return ((itemsResult.data ?? []) as PublicMenuRow[]).map((row) => ({
    ...toMenuItem(row as PublicMenuRow & { created_at?: string; updated_at?: string }),
    category: row.category_id ? byId.get(row.category_id) : undefined,
  }));
}

export async function fetchAdminCategories(storeId: string): Promise<Category[]> {
  const { data, error } = await getSupabase()
    .from('categories')
    .select('*')
    .eq('store_id', storeId)
    .order('name');
  if (error) throw new Error(error.message);
  return ((data ?? []) as Category[]).map((category) => toCategory(category));
}

interface SaleItemEmbed {
  id: string;
  sale_id: string;
  menu_item_id: string;
  quantity: number | string;
  unit_price: number | string;
  subtotal: number | string;
  options_label?: string | null;
  created_at: string;
  menu_items: MenuItem | MenuItem[] | null;
}

interface SaleEmbed {
  id: string;
  total: number | string;
  created_at: string;
  sale_items: SaleItemEmbed[] | null;
}

function firstMenuItem(value: MenuItem | MenuItem[] | null): MenuItem | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function fetchAdminSales(storeId: string): Promise<SaleWithItems[]> {
  const { data, error } = await getSupabase()
    .from('sales')
    .select(`
      id,
      total,
      created_at,
      sale_items (
        id,
        sale_id,
        menu_item_id,
        quantity,
        unit_price,
        subtotal,
        options_label,
        created_at,
        menu_items (
          id,
          name,
          description,
          price,
          stock,
          category_id,
          image_url,
          created_at,
          updated_at
        )
      )
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return ((data ?? []) as SaleEmbed[]).map((sale) => ({
    id: sale.id,
    total: asNumber(sale.total),
    created_at: sale.created_at,
    sale_items: (sale.sale_items ?? [])
      .map((item) => {
        const menuItem = firstMenuItem(item.menu_items);
        if (!menuItem) return null;
        return {
          id: item.id,
          sale_id: item.sale_id,
          menu_item_id: item.menu_item_id,
          quantity: asNumber(item.quantity),
          unit_price: asNumber(item.unit_price),
          subtotal: asNumber(item.subtotal),
          options_label: item.options_label ?? null,
          created_at: item.created_at,
          menu_item: {
            ...menuItem,
            price: asNumber(menuItem.price),
            stock: asNumber(menuItem.stock),
          },
        };
      })
      .filter((item): item is SaleWithItems['sale_items'][number] => item !== null),
  }));
}

interface KitchenItemEmbed {
  id: string;
  kitchen_order_id: string;
  menu_item_id: string | null;
  menu_item_name: string;
  quantity: number | string;
  options_label?: string | null;
  created_at: string;
}

interface KitchenEmbed {
  id: string;
  sale_id: string | null;
  order_number: number;
  customer_name?: string | null;
  status: 'new' | 'ready';
  created_at: string;
  ready_at: string | null;
  total_items: number | string;
  kitchen_order_items: KitchenItemEmbed[] | null;
}

function toKitchenItem(item: KitchenItemEmbed, fallbackOrderId: string): KitchenOrderItem {
  return {
    id: item.id,
    kitchen_order_id: item.kitchen_order_id || fallbackOrderId,
    menu_item_id: item.menu_item_id,
    menu_item_name: item.menu_item_name,
    quantity: asNumber(item.quantity),
    options_label: item.options_label ?? null,
    created_at: item.created_at,
  };
}

export async function fetchAdminKitchenOrders(storeId: string): Promise<KitchenOrderWithItems[]> {
  const { data, error } = await getSupabase()
    .from('kitchen_orders')
    .select(`
      id,
      sale_id,
      order_number,
      customer_name,
      status,
      created_at,
      ready_at,
      total_items,
      kitchen_order_items (
        id,
        kitchen_order_id,
        menu_item_id,
        menu_item_name,
        quantity,
        options_label,
        created_at
      )
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);

  return ((data ?? []) as KitchenEmbed[]).map((order) => ({
    id: order.id,
    sale_id: order.sale_id,
    order_number: asNumber(order.order_number),
    customer_name: order.customer_name ?? null,
    status: order.status,
    created_at: order.created_at,
    ready_at: order.ready_at,
    total_items: asNumber(order.total_items),
    kitchen_order_items: (order.kitchen_order_items ?? []).map((item) => toKitchenItem(item, order.id)),
  }));
}

interface PublicKitchenPayload {
  orders: Array<{
    id: string;
    order_number: number;
    customer_name?: string | null;
    status: 'new' | 'ready';
    created_at: string;
    ready_at: string | null;
    total_items: number;
    items: Array<{
      id: string;
      menu_item_id: string | null;
      menu_item_name: string;
      quantity: number;
      options_label?: string | null;
    }>;
  }>;
}

export async function fetchPublicKitchenOrders(slug: string): Promise<KitchenOrderWithItems[]> {
  const { data, error } = await getSupabase().rpc('list_kitchen_orders', { store_slug: slug });
  const payload = requireData(data as PublicKitchenPayload | null, error, 'Store not found');
  return (payload.orders ?? []).map((order) => ({
    id: order.id,
    sale_id: null,
    order_number: asNumber(order.order_number),
    customer_name: order.customer_name ?? null,
    status: order.status,
    created_at: order.created_at,
    ready_at: order.ready_at,
    total_items: asNumber(order.total_items),
    kitchen_order_items: (order.items ?? []).map((item) => ({
      id: item.id,
      kitchen_order_id: order.id,
      menu_item_id: item.menu_item_id,
      menu_item_name: item.menu_item_name,
      quantity: asNumber(item.quantity),
      options_label: item.options_label ?? null,
      created_at: order.created_at,
    })),
  }));
}

export async function createPublicSale(
  slug: string,
  lines: Array<{
    menu_item_id: string;
    quantity: number;
    drink?: string | null;
    doneness?: string | null;
    removed?: string[];
  }>,
  customerName: string,
): Promise<{ sale_id: string; order_number: number; total: number }> {
  const { data, error } = await getSupabase().rpc('create_sale', {
    store_slug: slug,
    lines,
    customer_name: customerName,
  });
  const payload = requireData(
    data as { sale_id: string; order_number: number; total: number | string } | null,
    error,
    'Store not found',
  );
  return {
    sale_id: payload.sale_id,
    order_number: asNumber(payload.order_number),
    total: asNumber(payload.total),
  };
}

export async function updatePublicKitchenOrder(
  slug: string,
  orderId: string,
  status: 'new' | 'ready',
): Promise<void> {
  const { error } = await getSupabase().rpc('update_kitchen_order', {
    store_slug: slug,
    order_id: orderId,
    next_status: status,
  });
  if (error) throw new Error(error.message);
}
