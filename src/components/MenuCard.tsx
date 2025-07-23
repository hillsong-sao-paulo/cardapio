
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { MenuItem, CartItem } from '../types/inventory';

interface MenuCardProps {
  item: MenuItem;
  cartItem?: CartItem;
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ 
  item, 
  cartItem, 
  onAddToCart, 
  onUpdateQuantity 
}) => {
  const quantity = cartItem?.quantity || 0;
  const isOutOfStock = item.stock === 0;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      onUpdateQuantity(item.id, 0);
    } else if (newQuantity <= item.stock) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  return (
    <Card className="transition-all duration-300 border-gray-200/50 bg-white/60 backdrop-blur-sm rounded-xl overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between space-x-4">
          {/* Informações do produto */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-900 truncate">
              {item.name}
            </h3>
            <p className="text-sm text-gray-600 font-light line-clamp-2 mt-1">
              {item.description}
            </p>
            <div className="flex items-center space-x-3 mt-2">
              <span className="text-lg font-medium text-gray-900">
                R$ {item.price.toFixed(2)}
              </span>
              <Badge 
                variant="secondary" 
                className={`text-xs font-light ${
                  isOutOfStock 
                    ? 'bg-red-50 text-red-600 border-red-200' 
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {isOutOfStock ? 'Esgotado' : `${item.stock} disponível`}
              </Badge>
            </div>
          </div>
          
          {/* Controles à direita */}
          <div className="flex-shrink-0">
            {isOutOfStock ? (
              <Button disabled className="bg-gray-200 text-gray-500 rounded-lg px-4 py-2 font-light">
                Esgotado
              </Button>
            ) : quantity === 0 ? (
              <Button 
                onClick={() => onAddToCart(item)}
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 py-2 font-light transition-colors"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            ) : (
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="h-8 w-8 p-0 hover:bg-gray-200 rounded-md"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                
                <span className="font-medium text-base min-w-[2rem] text-center text-gray-900">
                  {quantity}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= item.stock}
                  className="h-8 w-8 p-0 hover:bg-gray-200 rounded-md"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuCard;
