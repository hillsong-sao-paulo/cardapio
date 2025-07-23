
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Receipt } from 'lucide-react';
import { CartItem } from '../types/inventory';

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

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button 
          className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg border-0 p-0 transition-all duration-300"
          size="icon"
        >
          <ShoppingCart className="w-6 h-6" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold border-2 border-red-500">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg bg-white border-0">
        <SheetHeader>
          <SheetTitle className="flex items-center text-xl font-bold text-gray-900">
            <ShoppingCart className="w-5 h-5 mr-2 text-red-500" />
            Seu Pedido
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium text-lg">Seu carrinho está vazio</p>
              <p className="text-sm">Adicione itens para começar</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cartItems.map((cartItem) => (
                  <div key={cartItem.menuItem.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm text-gray-900 flex-1 pr-2">
                        {cartItem.menuItem.name}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateQuantity(cartItem.menuItem.id, 0)}
                        className="text-gray-400 hover:text-red-500 h-6 w-6 p-0 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {cartItem.quantity} × R$ {cartItem.menuItem.price.toFixed(2)}
                        </span>
                      </div>
                      <span className="font-bold text-gray-900">
                        R$ {cartItem.subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="bg-gray-200" />

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Total de Itens</span>
                  <span className="font-semibold text-gray-900">{totalItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-red-500">
                    R$ {totalValue.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button 
                onClick={onProcessSale}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-4 text-lg font-bold rounded-xl transition-all duration-300"
              >
                <Receipt className="w-5 h-5 mr-2" />
                Finalizar Pedido
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartSidebar;
