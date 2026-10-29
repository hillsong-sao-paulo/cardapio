import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

export const DEMO_ADMIN_EMAIL = 'admin@hillsong.com';
export const DEMO_ADMIN_PASSWORD = 'demo1234';

const DB_PATH = path.join(process.cwd(), '.local', 'demo-db.json');

export type DemoRow = Record<string, unknown> & { id: string };

export interface DemoDatabase {
  categories: DemoRow[];
  admin_users: DemoRow[];
  menu_items: DemoRow[];
  sales: DemoRow[];
  sale_items: DemoRow[];
  kitchen_orders: DemoRow[];
  kitchen_order_items: DemoRow[];
}

const TABLE_NAMES = [
  'categories',
  'admin_users',
  'menu_items',
  'sales',
  'sale_items',
  'kitchen_orders',
  'kitchen_order_items',
] as const;

export type DemoTableName = (typeof TABLE_NAMES)[number];

let database: DemoDatabase | null = null;

export function isDemoTable(name: string): name is DemoTableName {
  return (TABLE_NAMES as readonly string[]).includes(name);
}

function stamp(daysAgo: number, hour: number, minute: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString();
}

interface MenuSeed {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
}

const MENU: MenuSeed[] = [
  {
    id: 'item-wings',
    name: 'KOKABURRA WINGS (5 UNIDADES)',
    description: 'Sobreasas de frango empanadas, servidas com molho blue cheese',
    price: 25,
    stock: 40,
    categoryId: 'cat-pratos',
  },
  {
    id: 'item-fries',
    name: 'MINI AUSSIE FRIES',
    description: 'Batatas fritas cobertas com molho cheddar ranch e bacon crocante',
    price: 25,
    stock: 35,
    categoryId: 'cat-pratos',
  },
  {
    id: 'item-ribs',
    name: 'BILLY RIBS (4 UNIDADES)',
    description: 'Costelinhas suínas com molho barbecue ou billabong',
    price: 25,
    stock: 22,
    categoryId: 'cat-pratos',
  },
  {
    id: 'item-combo-ribs',
    name: 'COMBINAÇÃO DE BILLY & FRIES',
    description: 'Costelinhas suínas acompanhadas de batata frita',
    price: 40,
    stock: 18,
    categoryId: 'cat-pratos',
  },
  {
    id: 'item-combo-wings',
    name: 'COMBINAÇÃO DE WINGS & FRIES',
    description: 'Sobreasas de frango empanadas com batata frita',
    price: 40,
    stock: 16,
    categoryId: 'cat-pratos',
  },
  {
    id: 'item-brownie',
    name: 'MINI BROWNIE',
    description: 'Brownie de chocolate com nozes',
    price: 10,
    stock: 30,
    categoryId: 'cat-sobremesa',
  },
  {
    id: 'item-coke',
    name: 'REFRIGERANTE COCA-COLA',
    description: 'Coca-cola normal ou zero',
    price: 8,
    stock: 50,
    categoryId: 'cat-bebidas',
  },
  {
    id: 'item-tea',
    name: 'ICED TEA (500ML)',
    description: 'Sabores: limão, cranberry ou pêssego',
    price: 13,
    stock: 28,
    categoryId: 'cat-bebidas',
  },
  {
    id: 'item-steak',
    name: 'STEAK AU GRATIN & ARROZ PILAF + COCA-COLA OU ICE TEA',
    description: 'Fatias de filé mignon com molho gorgonzola e purê',
    price: 45,
    stock: 8,
    categoryId: 'cat-almoco',
  },
];

type SaleLine = [itemId: string, quantity: number];

interface SaleSeed {
  at: string;
  lines: SaleLine[];
  status: 'new' | 'ready';
  readyAt?: string;
}

function buildSaleSeeds(): SaleSeed[] {
  const older: Array<[number, number, number, SaleLine[]]> = [
    [2, 11, 20, [['item-wings', 2], ['item-coke', 2]]],
    [2, 12, 10, [['item-steak', 1], ['item-tea', 1]]],
    [2, 12, 45, [['item-ribs', 1], ['item-fries', 1]]],
    [2, 13, 30, [['item-combo-wings', 1], ['item-coke', 1]]],
    [2, 15, 15, [['item-brownie', 2], ['item-tea', 1]]],
    [2, 17, 5, [['item-fries', 2], ['item-coke', 1]]],
    [1, 11, 10, [['item-combo-ribs', 1], ['item-coke', 2]]],
    [1, 12, 5, [['item-wings', 1], ['item-brownie', 1]]],
    [1, 12, 40, [['item-steak', 2]]],
    [1, 13, 20, [['item-fries', 1], ['item-tea', 1], ['item-coke', 1]]],
    [1, 14, 50, [['item-ribs', 2], ['item-coke', 2]]],
    [1, 16, 30, [['item-combo-wings', 1], ['item-brownie', 1]]],
    [0, 11, 5, [['item-wings', 2], ['item-coke', 1]]],
    [0, 11, 40, [['item-fries', 1], ['item-tea', 1]]],
    [0, 12, 15, [['item-steak', 1]]],
    [0, 12, 35, [['item-ribs', 2]]],
    [0, 13, 0, [['item-combo-ribs', 1], ['item-coke', 2]]],
    [0, 13, 25, [['item-wings', 1], ['item-brownie', 1]]],
    [0, 14, 10, [['item-fries', 2], ['item-coke', 1]]],
    [0, 15, 20, [['item-steak', 1], ['item-tea', 1]]],
    [0, 16, 5, [['item-brownie', 3]]],
    [0, 16, 40, [['item-combo-wings', 1], ['item-coke', 1]]],
  ];

  const seeds: SaleSeed[] = older.map(([days, hour, minute, lines]) => {
    const at = stamp(days, hour, minute);
    return {
      at,
      lines,
      status: 'ready',
      readyAt: addMinutes(at, 8 + (minute % 7)),
    };
  });

  seeds.push(
    {
      at: minutesAgo(8),
      lines: [['item-wings', 1], ['item-coke', 1]],
      status: 'ready',
      readyAt: minutesAgo(0.5),
    },
    {
      at: minutesAgo(14),
      lines: [['item-combo-ribs', 1], ['item-tea', 1]],
      status: 'new',
    },
    {
      at: minutesAgo(7),
      lines: [['item-fries', 1], ['item-brownie', 1]],
      status: 'new',
    },
    {
      at: minutesAgo(3),
      lines: [['item-steak', 1]],
      status: 'new',
    },
  );

  return seeds;
}

function seedDatabase(): DemoDatabase {
  const now = new Date().toISOString();
  const menuById = new Map(MENU.map((item) => [item.id, item]));
  const db: DemoDatabase = {
    categories: [
      { id: 'cat-pratos', name: 'Pratos', description: 'Porções do lounge', created_at: now, updated_at: now },
      { id: 'cat-sobremesa', name: 'Sobremesa', description: 'Doces', created_at: now, updated_at: now },
      { id: 'cat-bebidas', name: 'Bebidas', description: 'Refrigerantes e chás', created_at: now, updated_at: now },
      { id: 'cat-almoco', name: 'Almoço', description: 'Pratos de almoço', created_at: now, updated_at: now },
    ],
    admin_users: [
      {
        id: 'admin-demo',
        name: 'Admin Lounge',
        email: DEMO_ADMIN_EMAIL,
        password_hash: bcrypt.hashSync(DEMO_ADMIN_PASSWORD, 10),
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ],
    menu_items: MENU.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      stock: item.stock,
      category_id: item.categoryId,
      image_url: null,
      created_at: now,
      updated_at: now,
    })),
    sales: [],
    sale_items: [],
    kitchen_orders: [],
    kitchen_order_items: [],
  };

  buildSaleSeeds().forEach((sale, index) => {
    const saleId = `sale-${String(index + 1).padStart(3, '0')}`;
    const orderId = `kitchen-${String(index + 1).padStart(3, '0')}`;
    let total = 0;
    let totalItems = 0;

    sale.lines.forEach(([itemId, quantity], lineIndex) => {
      const menuItem = menuById.get(itemId);
      if (!menuItem) throw new Error(`Unknown menu item ${itemId}`);
      const subtotal = menuItem.price * quantity;
      total += subtotal;
      totalItems += quantity;
      db.sale_items.push({
        id: `${saleId}-line-${lineIndex + 1}`,
        sale_id: saleId,
        menu_item_id: itemId,
        quantity,
        unit_price: menuItem.price,
        subtotal,
        created_at: sale.at,
      });
      db.kitchen_order_items.push({
        id: `${orderId}-line-${lineIndex + 1}`,
        kitchen_order_id: orderId,
        menu_item_id: itemId,
        menu_item_name: menuItem.name,
        quantity,
        created_at: sale.at,
      });
    });

    db.sales.push({
      id: saleId,
      total,
      created_at: sale.at,
    });
    db.kitchen_orders.push({
      id: orderId,
      sale_id: saleId,
      order_number: index + 1,
      status: sale.status,
      created_at: sale.at,
      ready_at: sale.readyAt ?? null,
      total_items: totalItems,
    });
  });

  return db;
}

function loadDatabase(): DemoDatabase {
  if (!fs.existsSync(DB_PATH)) return seedDatabase();
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw) as DemoDatabase;
}

export function getDatabase(): DemoDatabase {
  if (!database) {
    database = loadDatabase();
    saveDatabase();
  }
  return database;
}

export function saveDatabase(): void {
  if (!database) return;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(database, null, 2));
}

export function listRows(
  table: DemoTableName,
  options?: { where?: string; sort?: string; limit?: number; offset?: number },
): DemoRow[] {
  const db = getDatabase();
  let rows = [...db[table]];
  if (options?.where) rows = rows.filter((row) => matchesWhere(row, options.where!));
  if (options?.sort) rows.sort((a, b) => compareRows(a, b, options.sort!));
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 1000;
  return rows.slice(offset, offset + limit).map((row) => publicRow(table, row));
}

export function getRow(table: DemoTableName, id: string): DemoRow | null {
  const row = getDatabase()[table].find((item) => item.id === id) ?? null;
  return row ? publicRow(table, row) : null;
}

export function createRow(table: DemoTableName, payload: Record<string, unknown>): DemoRow {
  const db = getDatabase();
  const now = new Date().toISOString();
  const row: DemoRow = {
    ...payload,
    id: typeof payload.id === 'string' && payload.id ? payload.id : crypto.randomUUID(),
    created_at: typeof payload.created_at === 'string' ? payload.created_at : now,
    updated_at: typeof payload.updated_at === 'string' ? payload.updated_at : now,
  };
  db[table].push(row);
  saveDatabase();
  return publicRow(table, row);
}

export function updateRow(
  table: DemoTableName,
  id: string,
  payload: Record<string, unknown>,
): DemoRow | null {
  const db = getDatabase();
  const index = db[table].findIndex((item) => item.id === id);
  if (index < 0) return null;
  const current = db[table][index];
  const next: DemoRow = {
    ...current,
    ...payload,
    id: current.id,
    updated_at: typeof payload.updated_at === 'string' ? payload.updated_at : new Date().toISOString(),
  };
  db[table][index] = next;
  saveDatabase();
  return publicRow(table, next);
}

export function deleteRow(table: DemoTableName, id: string): boolean {
  const db = getDatabase();
  const before = db[table].length;
  db[table] = db[table].filter((item) => item.id !== id);
  if (db[table].length === before) return false;
  saveDatabase();
  return true;
}

export function findAdminByEmail(email: string): DemoRow | null {
  return getDatabase().admin_users.find((user) => user.email === email) ?? null;
}

export function findAdminById(id: string): DemoRow | null {
  return getDatabase().admin_users.find((user) => user.id === id) ?? null;
}

function publicRow(table: DemoTableName, row: DemoRow): DemoRow {
  if (table !== 'admin_users') return { ...row };
  const copy = { ...row };
  delete copy.password_hash;
  return copy;
}

function matchesWhere(row: DemoRow, where: string): boolean {
  return where.split('~and').every((part) => {
    const inner = stripParens(part);
    const match = inner.match(/^([^,]+),eq,(.*)$/);
    if (!match) return true;
    return String(row[match[1]] ?? '') === match[2];
  });
}

function stripParens(value: string): string {
  let current = value.trim();
  while (current.startsWith('(') && current.endsWith(')')) {
    current = current.slice(1, -1).trim();
  }
  return current;
}

function compareRows(a: DemoRow, b: DemoRow, sort: string): number {
  for (const field of sort.split(',')) {
    const descending = field.startsWith('-');
    const key = descending ? field.slice(1) : field;
    const left = a[key];
    const right = b[key];
    let result = 0;
    if (typeof left === 'number' && typeof right === 'number') result = left - right;
    else result = String(left ?? '').localeCompare(String(right ?? ''));
    if (result !== 0) return descending ? -result : result;
  }
  return 0;
}
