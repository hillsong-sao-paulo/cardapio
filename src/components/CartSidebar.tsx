
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
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg border-0 p-0 transition-all duration-300"
          size="icon"
        >
          <ShoppingCart className="w-6 h-6" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-white text-gray-900 rounded-full h-6 w-6 flex items-center justify-center text-xs font-medium border-2 border-gray-900">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg bg-white/95 backdrop-blur-md border-0">
        <SheetHeader>
          <SheetTitle className="flex items-center text-xl font-light text-gray-900">
            <ShoppingCart className="w-5 h-5 mr-2 text-gray-700" />
            Carrinho de Vendas
          </SheetTitle>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-light text-lg">Carrinho vazio</p>
              <p className="text-sm font-light">Adicione itens para iniciar uma venda</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {cartItems.map((cartItem) => (
                  <div key={cartItem.menuItem.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/30">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-sm text-gray-900">
                        {cartItem.menuItem.name}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateQuantity(cartItem.menuItem.id, 0)}
                        className="text-gray-400 hover:text-gray-600 h-6 w-6 p-0 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 font-light">
                          {cartItem.quantity} × R$ {cartItem.menuItem.price.toFixed(2)}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        R$ {cartItem.subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="bg-gray-200/50" />

              <div className="bg-gray-50/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/30">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600 font-light">Total de Itens</span>
                  <span className="font-medium text-gray-900">{totalItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total</span>
                  <span className="text-3xl font-light text-gray-900">
                    R$ {totalValue.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button 
                onClick={onProcessSale}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 text-lg font-light rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                <Receipt className="w-5 h-5 mr-2" />
                Registrar Venda
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartSidebar;
