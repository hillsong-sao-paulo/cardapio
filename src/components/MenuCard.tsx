
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/70 backdrop-blur-md hover:bg-white/80 rounded-2xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-medium text-gray-900 group-hover:text-gray-800 transition-colors mb-2">
              {item.name}
            </CardTitle>
            <CardDescription className="text-gray-600 text-sm font-light leading-relaxed">
              {item.description}
            </CardDescription>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-light text-gray-900">
              R$ {item.price.toFixed(2)}
            </span>
            <Badge variant="secondary" className={`text-xs font-light ${
              isOutOfStock 
                ? 'bg-red-50 text-red-600 border-red-200' 
                : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
              {isOutOfStock ? 'Esgotado' : `${item.stock} disponível`}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isOutOfStock ? (
          <Button disabled className="w-full bg-gray-200 text-gray-500 rounded-xl h-12 font-light">
            Fora de Estoque
          </Button>
        ) : quantity === 0 ? (
          <Button 
            onClick={() => onAddToCart(item)}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-12 font-light transition-all duration-300 hover:shadow-lg"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        ) : (
          <div className="flex items-center justify-between bg-gray-50/50 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity - 1)}
                className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-100 rounded-lg"
              >
                <Minus className="w-4 h-4" />
              </Button>
              
              <span className="font-medium text-lg min-w-[2rem] text-center text-gray-900">
                {quantity}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= item.stock}
                className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-100 rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-right">
              <span className="text-xs text-gray-500 font-light">Subtotal</span>
              <p className="font-medium text-lg text-gray-900">
                R$ {(item.price * quantity).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MenuCard;
