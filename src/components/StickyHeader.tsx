
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { CartItem } from '../types/inventory';

interface StickyHeaderProps {
  cartItems: CartItem[];
  onCartOpen: () => void;
}

const StickyHeader: React.FC<StickyHeaderProps> = ({ cartItems, onCartOpen }) => {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  if (cartItems.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-gray-900 font-sf">
              Kokaburra Wings
            </h1>
            <Badge variant="secondary" className="text-xs">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600 font-sf">Total</p>
              <p className="text-lg font-bold text-app-blue font-sf">
                R$ {totalValue.toFixed(2)}
              </p>
            </div>
            
            <Button
              onClick={onCartOpen}
              className="bg-app-blue hover:bg-app-blue-hover text-white font-sf relative"
              size="sm"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {totalItems}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyHeader;
