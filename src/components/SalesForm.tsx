import React, { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import MenuCard from './MenuCard';
import CartSidebar from './CartSidebar';
import SuccessScreen from './SuccessScreen';
import CategoryTabs from './CategoryTabs';
import { CartItem, MenuItem as InventoryMenuItem } from '../types/inventory';
import { MenuItemWithCategory } from '../types/database';
import { useMenuItems } from '../hooks/useMenuItems';
import { useCreateSale } from '../hooks/useSales';
import {
  ItemSelection,
  cartLineKey,
  formatOptions,
  optionProfileFor,
  saleOptionFields,
} from '@/lib/item-options';
import { compareMenuDisplay } from '@/lib/menu-order';

const SalesForm: React.FC<{ storeName?: string }> = ({ storeName }) => {
  const { data: menuItems = [], isLoading, isError, refetch } = useMenuItems();
  const createSale = useCreateSale();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const { toast } = useToast();

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map(item => item.category?.name).filter(Boolean)));
    return ['Todos', ...cats];
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    const visible = activeCategory === 'Todos'
      ? menuItems
      : menuItems.filter(item => item.category?.name === activeCategory);
    return [...visible].sort(compareMenuDisplay);
  }, [menuItems, activeCategory]);

  const toInventoryItem = (item: MenuItemWithCategory, stock: number): InventoryMenuItem => ({
    id: item.id,
    name: item.name,
    price: item.price,
    stock,
    category: item.category?.name || '',
    description: item.description || '',
    subItems: [],
    option_profile: item.option_profile,
  });

  const quantityInCart = (itemId: string, exceptLineKey?: string) =>
    cartItems
      .filter((cartItem) => cartItem.menuItem.id === itemId && cartItem.lineKey !== exceptLineKey)
      .reduce((sum, cartItem) => sum + cartItem.quantity, 0);

  const addToCart = (item: MenuItemWithCategory, selection: ItemSelection) => {
    const currentItem = menuItems.find(menuItem => menuItem.id === item.id);

    if (!currentItem || currentItem.stock <= 0) {
      toast({
        title: "Estoque insuficiente",
        description: `${item.name} está fora de estoque.`,
        variant: "destructive"
      });
      return;
    }

    const profile = optionProfileFor(currentItem);
    const optionsLabel = profile ? formatOptions(profile, selection) : null;
    if (profile && !optionsLabel) return;

    const lineKey = cartLineKey(item.id, optionsLabel);
    if (quantityInCart(item.id) >= currentItem.stock) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${currentItem.stock} unidades disponíveis de ${item.name}.`,
        variant: "destructive"
      });
      return;
    }

    const existingItem = cartItems.find(cartItem => cartItem.lineKey === lineKey);
    if (existingItem) {
      updateQuantity(lineKey, existingItem.quantity + 1);
      return;
    }

    const newCartItem: CartItem = {
      menuItem: toInventoryItem(item, currentItem.stock),
      quantity: 1,
      subtotal: item.price,
      lineKey,
      optionsLabel,
      selection: {
        drink: selection.drink,
        doneness: selection.doneness,
        removed: [...selection.removed],
      },
    };
    setCartItems([...cartItems, newCartItem]);
  };

  const updateQuantity = (lineKey: string, newQuantity: number) => {
    const currentLine = cartItems.find(item => item.lineKey === lineKey);
    if (!currentLine) return;

    if (newQuantity <= 0) {
      setCartItems(cartItems.filter(item => item.lineKey !== lineKey));
      return;
    }

    const currentMenuItem = menuItems.find(item => item.id === currentLine.menuItem.id);
    const usedByOthers = quantityInCart(currentLine.menuItem.id, lineKey);
    if (!currentMenuItem || usedByOthers + newQuantity > currentMenuItem.stock) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${currentMenuItem?.stock ?? 0} unidades disponíveis de ${currentLine.menuItem.name}.`,
        variant: "destructive"
      });
      return;
    }

    setCartItems(cartItems.map(item => item.lineKey === lineKey ? {
      ...item,
      quantity: newQuantity,
      subtotal: item.menuItem.price * newQuantity,
      menuItem: { ...item.menuItem, stock: currentMenuItem.stock },
    } : item));
  };

  const processSale = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de processar a venda.",
        variant: "destructive"
      });
      return;
    }

    const name = customerName.trim().replace(/\s+/g, ' ');
    if (!name) {
      toast({
        title: "Informe o nome",
        description: "O nome aparece na cozinha junto com o número do pedido.",
        variant: "destructive"
      });
      return;
    }

    // Verificação final de estoque antes de processar a venda
    const stockErrors: string[] = [];
    
    const requestedByItem = new Map<string, { name: string; quantity: number }>();
    for (const cartItem of cartItems) {
      const current = requestedByItem.get(cartItem.menuItem.id);
      requestedByItem.set(cartItem.menuItem.id, {
        name: cartItem.menuItem.name,
        quantity: (current?.quantity ?? 0) + cartItem.quantity,
      });
    }

    for (const [itemId, requested] of requestedByItem) {
      const currentMenuItem = menuItems.find(item => item.id === itemId);
      if (!currentMenuItem) {
        stockErrors.push(`${requested.name} não encontrado.`);
      } else if (currentMenuItem.stock < requested.quantity) {
        stockErrors.push(`${requested.name}: apenas ${currentMenuItem.stock} disponível, mas ${requested.quantity} solicitado.`);
      }
    }

    if (stockErrors.length > 0) {
      toast({
        title: "Erro de estoque",
        description: stockErrors.join(' '),
        variant: "destructive"
      });
      
      // Atualizar carrinho com estoque atual disponível
      setCartItems(prevItems => {
        const used = new Map<string, number>();
        return prevItems.map(cartItem => {
          const currentMenuItem = menuItems.find(item => item.id === cartItem.menuItem.id);
          const already = used.get(cartItem.menuItem.id) ?? 0;
          const allowed = Math.max(0, (currentMenuItem?.stock ?? 0) - already);
          const quantity = Math.min(cartItem.quantity, allowed);
          used.set(cartItem.menuItem.id, already + quantity);
          return {
            ...cartItem,
            quantity,
            subtotal: cartItem.menuItem.price * quantity,
          };
        }).filter(item => item.quantity > 0);
      });
      
      return;
    }

    try {
      const saleData = {
        total: cartItems.reduce((sum, item) => sum + item.subtotal, 0),
        customer_name: name,
        items: cartItems.map(item => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          unit_price: item.menuItem.price,
          subtotal: item.subtotal,
          options_label: item.optionsLabel,
          ...saleOptionFields(optionProfileFor(item.menuItem), item.selection),
        }))
      };

      await createSale.mutateAsync(saleData);

      // Limpar carrinho e mostrar sucesso
      setCartItems([]);
      setCustomerName('');
      setIsCartOpen(false);
      setShowSuccessScreen(true);

      toast({
        title: "Venda processada com sucesso!",
        description: "O estoque foi atualizado automaticamente.",
        variant: "default"
      });

    } catch (error) {
      toast({
        title: "Erro ao processar venda",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    }
  };

  const linesFor = (itemId: string) => cartItems.filter(item => item.menuItem.id === itemId);

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <p className="text-gray-700">Loja não encontrada.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo com logo */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <img 
                src="/brand/d8797de3-f66c-4df1-be7a-6f33464353d3.png" 
                alt="Hillsong Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 font-sf">{storeName || 'Ponto de Vendas'}</h1>
              <p className="text-sm text-gray-500 font-sf">Cardápio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <CategoryTabs 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory}
        categories={categories}
      />

      {/* Lista de produtos */}
      <div className="px-4 py-4 pb-24">
        <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-3 md:max-w-5xl md:grid-cols-2 md:items-start">
          {filteredMenuItems.map(item => (
            <MenuCard 
              key={item.id} 
              item={toInventoryItem(item, item.stock)}
              lines={linesFor(item.id)}
              onAdd={(selection) => addToCart(item, selection)}
              onUpdateQuantity={updateQuantity} 
            />
          ))}
        </div>
      </div>

      <CartSidebar 
        cartItems={cartItems}
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        onUpdateQuantity={updateQuantity} 
        onProcessSale={processSale} 
        isOpen={isCartOpen} 
        onOpenChange={setIsCartOpen} 
      />

      {/* Rodapé com logo */}
      <footer className="bg-white border-t border-gray-200 mt-8 py-6">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-center">
            <img 
              src="/brand/397f96e7-0d6d-4eb1-a7f9-2d0c8fff89fd.png" 
              alt="Hillsong São Paulo" 
              className="h-8 opacity-60"
            />
          </div>
        </div>
      </footer>

      <SuccessScreen 
        isVisible={showSuccessScreen} 
        onClose={() => setShowSuccessScreen(false)} 
      />
    </div>
  );
};

export default SalesForm;
