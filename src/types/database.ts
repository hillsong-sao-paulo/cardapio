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
  created_at: string;
}

export interface MenuItemWithCategory extends MenuItem {
  category?: Category;
}

export interface SaleWithItems extends Sale {
  sale_items: (SaleItem & { menu_item: MenuItem })[];
}
