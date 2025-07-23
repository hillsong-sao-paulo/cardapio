
export interface SubItem {
  id: string;
  name: string;
  quantityUsed: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  subItems?: SubItem[];
  image?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  subtotal: number;
}

export interface SaleRecord {
  id: string;
  items: CartItem[];
  total: number;
  timestamp: Date;
}

export interface StockItem {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
}
