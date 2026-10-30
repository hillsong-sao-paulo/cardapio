import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import MenuCard from './MenuCard';
import CartSidebar from './CartSidebar';
import SuccessScreen from './SuccessScreen';
import CategoryTabs from './CategoryTabs';
import { CartItem, SaleRecord } from '../types/inventory';
import { MenuItemWithCategory } from '../types/database';
import { useMenuItems } from '../hooks/useMenuItems';
import { useCreateSale } from '../hooks/useSales';
import { useNavigate } from 'react-router-dom';

const SalesForm: React.FC<{ storeName?: string }> = ({ storeName }) => {
  const { data: menuItems = [], isLoading, isError, refetch } = useMenuItems();
  const createSale = useCreateSale();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const { toast } = useToast();
  const navigate = useNavigate();

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map(item => item.category?.name).filter(Boolean)));
    return ['Todos', ...cats];
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    if (activeCategory === 'Todos') {
      return menuItems;
    }
    return menuItems.filter(item => item.category?.name === activeCategory);
  }, [menuItems, activeCategory]);

  const addToCart = (item: MenuItemWithCategory) => {
    // Buscar o item mais atualizado da lista para verificar estoque atual
    const currentItem = menuItems.find(menuItem => menuItem.id === item.id);
    
    if (!currentItem || currentItem.stock <= 0) {
      toast({
        title: "Estoque insuficiente",
        description: `${item.name} está fora de estoque.`,
        variant: "destructive"
      });
      return;
    }

    const existingItem = cartItems.find(cartItem => cartItem.menuItem.id === item.id);
    if (existingItem) {
      if (existingItem.quantity >= currentItem.stock) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${currentItem.stock} unidades disponíveis de ${item.name}.`,
          variant: "destructive"
        });
        return;
      }
      updateQuantity(item.id, existingItem.quantity + 1);
    } else {
      const newCartItem: CartItem = {
        menuItem: {
          id: item.id,
          name: item.name,
          price: item.price,
          stock: currentItem.stock,
          category: item.category?.name || '',
          description: item.description || '',
          subItems: []
        },
        quantity: 1,
        subtotal: item.price
      };
      setCartItems([...cartItems, newCartItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter(item => item.menuItem.id !== itemId));
    } else {
      // Verificar estoque atual antes de atualizar
      const currentMenuItem = menuItems.find(item => item.id === itemId);
      if (currentMenuItem && newQuantity > currentMenuItem.stock) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${currentMenuItem.stock} unidades disponíveis.`,
          variant: "destructive"
        });
        return;
      }

      setCartItems(cartItems.map(item => item.menuItem.id === itemId ? {
        ...item,
        quantity: newQuantity,
        subtotal: item.menuItem.price * newQuantity
      } : item));
    }
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

    // Verificação final de estoque antes de processar a venda
    const stockErrors: string[] = [];
    
    for (const cartItem of cartItems) {
      const currentMenuItem = menuItems.find(item => item.id === cartItem.menuItem.id);
      if (!currentMenuItem) {
        stockErrors.push(`${cartItem.menuItem.name} não encontrado.`);
      } else if (currentMenuItem.stock < cartItem.quantity) {
        stockErrors.push(`${cartItem.menuItem.name}: apenas ${currentMenuItem.stock} disponível, mas ${cartItem.quantity} solicitado.`);
      }
    }

    if (stockErrors.length > 0) {
      toast({
        title: "Erro de estoque",
        description: stockErrors.join(' '),
        variant: "destructive"
      });
      
      // Atualizar carrinho com estoque atual disponível
      setCartItems(prevItems => 
        prevItems.map(cartItem => {
          const currentMenuItem = menuItems.find(item => item.id === cartItem.menuItem.id);
          if (currentMenuItem && currentMenuItem.stock < cartItem.quantity) {
            return {
              ...cartItem,
              quantity: Math.max(0, currentMenuItem.stock),
              subtotal: cartItem.menuItem.price * Math.max(0, currentMenuItem.stock)
            };
          }
          return cartItem;
        }).filter(item => item.quantity > 0)
      );
      
      return;
    }

    try {
      const saleData = {
        total: cartItems.reduce((sum, item) => sum + item.subtotal, 0),
        items: cartItems.map(item => ({
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          unit_price: item.menuItem.price,
          subtotal: item.subtotal
        }))
      };

      await createSale.mutateAsync(saleData);

      // Limpar carrinho e mostrar sucesso
      setCartItems([]);
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

  const getCartItem = (itemId: string) => {
    return cartItems.find(item => item.menuItem.id === itemId);
  };

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
        <div className="max-w-md mx-auto">
          {filteredMenuItems.map(item => (
            <MenuCard 
              key={item.id} 
              item={{
                id: item.id,
                name: item.name,
                description: item.description || '',
                price: item.price,
                stock: item.stock,
                category: item.category?.name || '',
                subItems: []
              }}
              cartItem={getCartItem(item.id)} 
              onAddToCart={() => addToCart(item)} 
              onUpdateQuantity={updateQuantity} 
            />
          ))}
        </div>
      </div>

      <CartSidebar 
        cartItems={cartItems} 
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
