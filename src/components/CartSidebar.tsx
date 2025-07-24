import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Receipt, Plus, Minus, CreditCard } from 'lucide-react';
import { CartItem } from '../types/inventory';
import { useIsMobile } from '@/hooks/use-mobile';

interface CartSidebarProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onProcessSale: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({
  cartItems,
  onUpdateQuantity,
  onProcessSale,
  isOpen,
  onOpenChange
}) => {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const isMobile = useIsMobile();
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Minimizar quando rolar para baixo, mostrar totalmente quando rolar para cima
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsMinimized(true);
      } else if (currentScrollY < lastScrollY) {
        setIsMinimized(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const StickyBottomBar = () => {
    if (cartItems.length === 0) return null;

    return (
      <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 pb-4 transition-transform duration-300 ${
        isMinimized ? 'translate-y-20' : 'translate-y-0'
      }`}>
        <div className="bg-app-blue/95 backdrop-blur-sm border border-app-blue shadow-lg rounded-[20px] mx-4">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white font-sf">
                  {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                </p>
                <p className="text-lg font-bold text-white font-sf">
                  R$ {totalValue.toFixed(2)}
                </p>
              </div>
              
              <Button
                onClick={() => onOpenChange(true)}
                className="bg-white text-app-blue hover:bg-gray-100 font-sf"
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CartContent = () => (
    <div className="space-y-4">
      {cartItems.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="font-medium text-lg font-sf">Seu carrinho está vazio</p>
          <p className="text-sm font-sf">Adicione itens para começar</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {cartItems.map((cartItem) => (
              <div key={cartItem.menuItem.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm text-gray-900 flex-1 pr-2 font-sf">
                    {cartItem.menuItem.name}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateQuantity(cartItem.menuItem.id, 0)}
                    className="text-gray-400 hover:text-app-blue h-6 w-6 p-0 rounded-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 font-sf">
                      {cartItem.quantity} × R$ {cartItem.menuItem.price.toFixed(2)}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900 font-sf">
                    R$ {cartItem.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Separator className="bg-gray-200" />

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 font-sf">Total de Itens</span>
              <span className="font-semibold text-gray-900 font-sf">{totalItems}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900 font-sf">Total</span>
              <span className="text-2xl font-bold text-app-blue font-sf">
                R$ {totalValue.toFixed(2)}
              </span>
            </div>
          </div>

          <Button 
            onClick={onProcessSale}
            className="w-full bg-app-blue hover:bg-app-blue-hover text-white py-4 text-lg font-bold rounded-xl transition-all duration-300 font-sf"
          >
            <Receipt className="w-5 h-5 mr-2" />
            Finalizar Pedido
          </Button>
        </>
      )}
    </div>
  );

  if (!isMobile) {
    return (
      <>
        <StickyBottomBar />
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
          <SheetContent className="w-full sm:max-w-lg bg-white border-0">
            <SheetHeader>
              <SheetTitle className="flex items-center text-xl font-bold text-gray-900 font-sf">
                <ShoppingCart className="w-5 h-5 mr-2 text-app-blue" />
                Seu Pedido
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6">
              <CartContent />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <>
      <StickyBottomBar />
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-white border-0 max-h-[85vh]">
          <DrawerHeader className="pb-4">
            <DrawerTitle className="flex items-center justify-center text-xl font-bold text-gray-900 font-sf">
              <ShoppingCart className="w-5 h-5 mr-2 text-app-blue" />
              Seu Pedido
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto">
            <CartContent />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default CartSidebar;
