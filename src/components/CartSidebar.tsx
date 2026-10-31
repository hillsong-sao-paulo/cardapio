import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Receipt, Plus, Minus, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CartItem } from '../types/inventory';
import { useIsMobile } from '@/hooks/use-mobile';

interface CartSidebarProps {
  cartItems: CartItem[];
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onProcessSale: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function StickyBottomBar({
  cartItems,
  totalItems,
  totalValue,
  isMinimized,
  onOpen,
}: {
  cartItems: CartItem[];
  totalItems: number;
  totalValue: number;
  isMinimized: boolean;
  onOpen: () => void;
}) {
  if (cartItems.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`transition-all duration-300 ease-in-out ${
        isMinimized ? 'scale-90' : 'scale-100'
      }`}>
        {isMinimized ? (
          <div className="relative">
            <Button
              onClick={onOpen}
              className="w-14 h-14 rounded-full bg-app-blue hover:bg-app-blue-hover text-white shadow-lg"
              size="icon"
            >
              <ShoppingCart className="w-6 h-6" />
            </Button>
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
                {totalItems > 99 ? '99+' : totalItems}
              </Badge>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 shadow-lg rounded-2xl min-w-[280px] max-w-sm">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 font-sf">
                    {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                  </p>
                  <p className="text-lg font-bold text-gray-900 font-sf">
                    R$ {totalValue.toFixed(2)}
                  </p>
                </div>

                <Button
                  onClick={onOpen}
                  className="bg-app-blue hover:bg-app-blue-hover text-white font-sf"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Ver Carrinho
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CartContent({
  cartItems,
  customerName,
  onCustomerNameChange,
  totalItems,
  totalValue,
  onUpdateQuantity,
  onProcessSale,
}: {
  cartItems: CartItem[];
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  totalItems: number;
  totalValue: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onProcessSale: () => void;
}) {
  return (
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
              <div key={cartItem.lineKey} className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-2">
                    <h4 className="font-semibold text-sm text-gray-900 font-sf">
                      {cartItem.menuItem.name}
                    </h4>
                    {cartItem.optionsLabel ? (
                      <p className="mt-1 text-xs text-gray-500 whitespace-pre-line font-sf">
                        {cartItem.optionsLabel}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateQuantity(cartItem.lineKey, 0)}
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

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-800 font-sf">Nome</span>
            <Input
              value={customerName}
              onChange={(event) => onCustomerNameChange(event.target.value.slice(0, 60))}
              maxLength={60}
              autoComplete="name"
              placeholder="Nome de quem retira"
              className="rounded-xl bg-white font-sf"
            />
          </label>

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
}

const CartSidebar: React.FC<CartSidebarProps> = ({
  cartItems,
  customerName,
  onCustomerNameChange,
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

  if (!isMobile) {
    return (
      <>
        <StickyBottomBar
          cartItems={cartItems}
          totalItems={totalItems}
          totalValue={totalValue}
          isMinimized={isMinimized}
          onOpen={() => onOpenChange(true)}
        />
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
          <SheetContent className="w-full sm:max-w-lg bg-white border-0">
            <SheetHeader>
              <SheetTitle className="flex items-center text-xl font-bold text-gray-900 font-sf">
                <ShoppingCart className="w-5 h-5 mr-2 text-app-blue" />
                Seu Pedido
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6">
              <CartContent
                cartItems={cartItems}
                customerName={customerName}
                onCustomerNameChange={onCustomerNameChange}
                totalItems={totalItems}
                totalValue={totalValue}
                onUpdateQuantity={onUpdateQuantity}
                onProcessSale={onProcessSale}
              />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <>
      <StickyBottomBar
        cartItems={cartItems}
        totalItems={totalItems}
        totalValue={totalValue}
        isMinimized={isMinimized}
        onOpen={() => onOpenChange(true)}
      />
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-white border-0 max-h-[85vh]">
          <DrawerHeader className="pb-4">
            <DrawerTitle className="flex items-center justify-center text-xl font-bold text-gray-900 font-sf">
              <ShoppingCart className="w-5 h-5 mr-2 text-app-blue" />
              Seu Pedido
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto">
            <CartContent
              cartItems={cartItems}
              customerName={customerName}
              onCustomerNameChange={onCustomerNameChange}
              totalItems={totalItems}
              totalValue={totalValue}
              onUpdateQuantity={onUpdateQuantity}
              onProcessSale={onProcessSale}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default CartSidebar;
