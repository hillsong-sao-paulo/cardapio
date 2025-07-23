
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
    <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
              {item.name}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              {item.description}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
            {item.category}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-green-600">
              R$ {item.price.toFixed(2)}
            </span>
            <span className={`text-sm ${isOutOfStock ? 'text-red-500' : 'text-gray-500'}`}>
              Estoque: {item.stock}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isOutOfStock ? (
          <Button disabled className="w-full bg-gray-300">
            Fora de Estoque
          </Button>
        ) : quantity === 0 ? (
          <Button 
            onClick={() => onAddToCart(item)}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Adicionar ao Carrinho
          </Button>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity - 1)}
                className="h-8 w-8 p-0 border-orange-300 hover:bg-orange-50"
              >
                <Minus className="w-4 h-4" />
              </Button>
              
              <span className="font-semibold text-lg min-w-[2rem] text-center">
                {quantity}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= item.stock}
                className="h-8 w-8 p-0 border-orange-300 hover:bg-orange-50"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-right">
              <span className="text-sm text-gray-500">Subtotal:</span>
              <p className="font-bold text-lg text-green-600">
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
