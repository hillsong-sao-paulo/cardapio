import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import MenuCard from './MenuCard';
import CartSidebar from './CartSidebar';
import SuccessScreen from './SuccessScreen';
import { MenuItem, CartItem, SaleRecord, StockItem } from '../types/inventory';
import { menuItems as initialMenuItems, stockItems as initialStockItems } from '../data/menuData';

const SalesForm: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [stockItems, setStockItems] = useState<StockItem[]>(initialStockItems);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const { toast } = useToast();

  const addToCart = (item: MenuItem) => {
    const existingItem = cartItems.find(cartItem => cartItem.menuItem.id === item.id);
    if (existingItem) {
      updateQuantity(item.id, existingItem.quantity + 1);
    } else {
      const newCartItem: CartItem = {
        menuItem: item,
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
      setCartItems(cartItems.map(item => item.menuItem.id === itemId ? {
        ...item,
        quantity: newQuantity,
        subtotal: item.menuItem.price * newQuantity
      } : item));
    }
  };

  const updateStock = (itemId: string, quantityUsed: number) => {
    setStockItems(currentStock => currentStock.map(stockItem => stockItem.id === itemId ? {
      ...stockItem,
      currentStock: stockItem.currentStock - quantityUsed
    } : stockItem));
  };

  const updateMenuItemStock = (itemId: string, quantityUsed: number) => {
    setMenuItems(currentMenu => currentMenu.map(menuItem => menuItem.id === itemId ? {
      ...menuItem,
      stock: menuItem.stock - quantityUsed
    } : menuItem));
  };

  const processSale = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de processar a venda.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se há estoque suficiente
    for (const cartItem of cartItems) {
      if (cartItem.quantity > cartItem.menuItem.stock) {
        toast({
          title: "Estoque insuficiente",
          description: `Não há estoque suficiente para ${cartItem.menuItem.name}.`,
          variant: "destructive"
        });
        return;
      }
    }

    // Processar a venda
    const saleRecord: SaleRecord = {
      id: Date.now().toString(),
      items: [...cartItems],
      total: cartItems.reduce((sum, item) => sum + item.subtotal, 0),
      timestamp: new Date()
    };

    // Atualizar estoque dos itens do menu
    cartItems.forEach(cartItem => {
      updateMenuItemStock(cartItem.menuItem.id, cartItem.quantity);

      // Atualizar estoque dos sub-itens
      if (cartItem.menuItem.subItems) {
        cartItem.menuItem.subItems.forEach(subItem => {
          updateStock(subItem.id, subItem.quantityUsed * cartItem.quantity);
        });
      }
    });

    // Adicionar ao histórico
    setSalesHistory([saleRecord, ...salesHistory]);

    // Limpar carrinho
    setCartItems([]);
    setIsCartOpen(false);

    // Mostrar tela de sucesso ao invés do toast
    setShowSuccessScreen(true);
  };

  const getCartItem = (itemId: string) => {
    return cartItems.find(item => item.menuItem.id === itemId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo com logo */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <img 
                src="/lovable-uploads/d8797de3-f66c-4df1-be7a-6f33464353d3.png" 
                alt="Hillsong Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 font-sf">Ponto de Vendas</h1>
              <p className="text-sm text-gray-500 font-sf">Cardápio do Lounge</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de produtos */}
      <div className="px-4 py-4 pb-24">
        <div className="max-w-md mx-auto">
          {menuItems.map(item => (
            <MenuCard 
              key={item.id} 
              item={item} 
              cartItem={getCartItem(item.id)} 
              onAddToCart={addToCart} 
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

      {/* Histórico de Vendas - apenas em desktop */}
      {salesHistory.length > 0 && (
        <div className="hidden md:block mt-12 max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 font-sf">
              Histórico de Vendas
            </h2>
            <div className="space-y-3">
              {salesHistory.slice(0, 5).map(sale => (
                <div key={sale.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-gray-900 font-sf">
                        Venda #{sale.id}
                      </span>
                      <span className="text-sm text-gray-500 ml-4 font-sf">
                        {sale.timestamp.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 font-sf">
                      R$ {sale.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <SuccessScreen 
        isVisible={showSuccessScreen} 
        onClose={() => setShowSuccessScreen(false)} 
      />
    </div>
  );
};

export default SalesForm;
