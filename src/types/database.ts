
export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category_id: string | null;
  image_url: string | null;
  option_profile?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  total: number;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  options_label?: string | null;
  created_at: string;
}

export interface KitchenOrder {
  id: string;
  sale_id: string | null;
  order_number: number;
  status: 'new' | 'ready';
  created_at: string;
  ready_at: string | null;
  total_items: number;
}

export interface KitchenOrderItem {
  id: string;
  kitchen_order_id: string;
  menu_item_id: string | null;
  menu_item_name: string;
  quantity: number;
  options_label?: string | null;
  created_at: string;
  menu_item?: MenuItem;
}

export interface KitchenOrderWithItems extends KitchenOrder {
  kitchen_order_items: KitchenOrderItem[];
}

export interface MenuItemWithCategory extends MenuItem {
  category?: Category;
}

export interface SaleWithItems extends Sale {
  sale_items: (SaleItem & { menu_item: MenuItem })[];
}
