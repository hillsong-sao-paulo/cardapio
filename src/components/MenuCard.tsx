
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus } from 'lucide-react';
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
    <Card className="bg-white border-0 shadow-sm rounded-2xl overflow-hidden mb-3">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-3">
          {/* Header com nome e preço */}
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-3">
              <h3 className="text-base font-semibold text-gray-900 leading-tight mb-1">
                {item.name}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                {item.description}
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-900">
                  R$ {item.price.toFixed(2)}
                </span>
                {isOutOfStock ? (
                  <Badge variant="destructive" className="text-xs">
                    Esgotado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {item.stock} disponível
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Controles de quantidade */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-400 uppercase tracking-wide">
              Quantidade
            </div>
            
            <div className="flex items-center">
              {isOutOfStock ? (
                <div className="bg-gray-100 text-gray-400 px-4 py-2 rounded-full text-sm font-medium">
                  Indisponível
                </div>
              ) : quantity === 0 ? (
                <Button 
                  onClick={() => onAddToCart(item)}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full text-sm font-medium h-auto"
                >
                  Adicionar
                </Button>
              ) : (
                <div className="flex items-center bg-gray-50 rounded-full p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="h-8 w-8 rounded-full p-0 hover:bg-red-100 text-red-500 hover:text-red-600"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  
                  <span className="font-semibold text-base min-w-[2.5rem] text-center text-gray-900">
                    {quantity}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= item.stock}
                    className="h-8 w-8 rounded-full p-0 hover:bg-red-100 text-red-500 hover:text-red-600 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuCard;
