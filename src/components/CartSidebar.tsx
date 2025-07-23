
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
        <Button className="fixed top-4 right-4 z-50 bg-orange-600 hover:bg-orange-700 text-white shadow-lg">
          <ShoppingCart className="w-5 h-5 mr-2" />
          Carrinho
          {totalItems > 0 && (
            <Badge className="ml-2 bg-white text-orange-600">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center text-xl">
            <ShoppingCart className="w-5 h-5 mr-2 text-orange-600" />
            Carrinho de Vendas
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Carrinho vazio</p>
              <p className="text-sm">Adicione itens para iniciar uma venda</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cartItems.map((cartItem) => (
                  <div key={cartItem.menuItem.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm text-gray-800">
                        {cartItem.menuItem.name}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateQuantity(cartItem.menuItem.id, 0)}
                        className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          Qtd: {cartItem.quantity}
                        </span>
                        <span className="text-sm text-gray-600">
                          × R$ {cartItem.menuItem.price.toFixed(2)}
                        </span>
                      </div>
                      <span className="font-semibold text-green-600">
                        R$ {cartItem.subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Total de Itens:</span>
                  <span className="font-semibold">{totalItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {totalValue.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button 
                onClick={onProcessSale}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-lg font-semibold"
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
