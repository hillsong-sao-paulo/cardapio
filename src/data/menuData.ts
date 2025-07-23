
import { MenuItem, StockItem } from '../types/inventory';

export const stockItems: StockItem[] = [
  { id: 'chicken-wings', name: 'Sobreasas de Frango', currentStock: 50, unit: 'unidades' },
  { id: 'french-fries', name: 'Batata Frita', currentStock: 30, unit: 'porções' },
  { id: 'pork-ribs', name: 'Costelinhas Suínas', currentStock: 25, unit: 'unidades' },
  { id: 'brownie', name: 'Brownie', currentStock: 15, unit: 'unidades' },
  { id: 'coca-cola', name: 'Coca-Cola', currentStock: 40, unit: 'unidades' },
  { id: 'iced-tea', name: 'Iced Tea', currentStock: 25, unit: 'unidades' },
  { id: 'steak', name: 'Filé Mignon', currentStock: 12, unit: 'porções' },
  { id: 'rice', name: 'Arroz Pilaf', currentStock: 20, unit: 'porções' },
];

export const menuItems: MenuItem[] = [
  {
    id: 'kokaburra-wings',
    name: 'KOKABURRA WINGS (5 UNIDADES)',
    description: 'Sobreasas de frango empanadas, servidas com molho blue cheese',
    price: 25,
    stock: 10,
    category: 'Aperitivos',
    subItems: [
      { id: 'chicken-wings', name: 'Sobreasas de Frango', quantityUsed: 5 }
    ]
  },
  {
    id: 'mini-aussie-fries',
    name: 'MINI AUSSIE FRIES',
    description: 'Batatas fritas cobertas com molho cheddar ranch e bacon crocante',
    price: 25,
    stock: 8,
    category: 'Aperitivos',
    subItems: [
      { id: 'french-fries', name: 'Batata Frita', quantityUsed: 1 }
    ]
  },
  {
    id: 'billy-ribs',
    name: 'BILLY RIBS (4 UNIDADES)',
    description: 'Costelinhas suínas com molho barbecue ou billabong',
    price: 25,
    stock: 6,
    category: 'Carnes',
    subItems: [
      { id: 'pork-ribs', name: 'Costelinhas Suínas', quantityUsed: 4 }
    ]
  },
  {
    id: 'combo-billy-fries',
    name: 'COMBINAÇÃO DE BILLY & FRIES',
    description: 'Costelinhas suínas acompanhadas de batata frita',
    price: 40,
    stock: 5,
    category: 'Combinações',
    subItems: [
      { id: 'pork-ribs', name: 'Costelinhas Suínas', quantityUsed: 4 },
      { id: 'french-fries', name: 'Batata Frita', quantityUsed: 1 }
    ]
  },
  {
    id: 'combo-wings-fries',
    name: 'COMBINAÇÃO DE WINGS & FRIES',
    description: 'Sobreasas de frango empanadas com batata frita',
    price: 40,
    stock: 7,
    category: 'Combinações',
    subItems: [
      { id: 'chicken-wings', name: 'Sobreasas de Frango', quantityUsed: 5 },
      { id: 'french-fries', name: 'Batata Frita', quantityUsed: 1 }
    ]
  },
  {
    id: 'mini-brownie',
    name: 'MINI BROWNIE',
    description: 'Brownie de chocolate com nozes',
    price: 10,
    stock: 15,
    category: 'Sobremesas',
    subItems: [
      { id: 'brownie', name: 'Brownie', quantityUsed: 1 }
    ]
  },
  {
    id: 'coca-cola',
    name: 'REFRIGERANTE COCA-COLA',
    description: 'Coca-cola normal ou zero',
    price: 8,
    stock: 20,
    category: 'Bebidas',
    subItems: [
      { id: 'coca-cola', name: 'Coca-Cola', quantityUsed: 1 }
    ]
  },
  {
    id: 'iced-tea',
    name: 'ICED TEA (500ML)',
    description: 'Sabores: limão, cranberry ou pêssego',
    price: 13,
    stock: 12,
    category: 'Bebidas',
    subItems: [
      { id: 'iced-tea', name: 'Iced Tea', quantityUsed: 1 }
    ]
  },
  {
    id: 'steak-combo',
    name: 'STEAK AU GRATIN & ARROZ PILAF + COCA-COLA OU ICE TEA',
    description: 'Fatias de filé mignon com molho gorgonzola e purê',
    price: 45,
    stock: 4,
    category: 'Pratos Principais',
    subItems: [
      { id: 'steak', name: 'Filé Mignon', quantityUsed: 1 },
      { id: 'rice', name: 'Arroz Pilaf', quantityUsed: 1 },
      { id: 'coca-cola', name: 'Coca-Cola', quantityUsed: 1 }
    ]
  }
];
