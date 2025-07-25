
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useSales } from '@/hooks/useSales';
import { MenuItem } from '@/types/database';

interface SalesFormProps {
  onSuccess: () => void;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

const SalesForm: React.FC<SalesFormProps> = ({ onSuccess }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const { toast } = useToast();
  const { menuItems, isLoading: isLoadingItems } = useMenuItems();
  const { createSale } = useSales();

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      if (existingItem.quantity >= item.stock) {
        toast({
          title: 'Estoque insuficiente',
          description: `Apenas ${item.stock} unidades disponíveis`,
          variant: 'destructive',
        });
        return;
      }
      
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      if (item.stock <= 0) {
        toast({
          title: 'Produto indisponível',
          description: 'Este item está fora de estoque',
          variant: 'destructive',
        });
        return;
      }
      
      setCart([...cart, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        stock: item.stock,
      }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    const item = cart.find(cartItem => cartItem.id === itemId);
    if (!item) return;

    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    if (quantity > item.stock) {
      toast({
        title: 'Estoque insuficiente',
        description: `Apenas ${item.stock} unidades disponíveis`,
        variant: 'destructive',
      });
      return;
    }

    setCart(cart.map(cartItem =>
      cartItem.id === itemId
        ? { ...cartItem, quantity }
        : cartItem
    ));
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione itens ao carrinho antes de finalizar',
        variant: 'destructive',
      });
      return;
    }

    try {
      const saleData = {
        total: getTotal(),
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        })),
      };

      await createSale.mutateAsync(saleData);

      toast({
        title: 'Venda registrada com sucesso!',
        description: `Total: R$ ${getTotal().toFixed(2)}`,
      });

      // Limpar formulário
      setCart([]);
      setCustomerName('');
      onSuccess();
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      toast({
        title: 'Erro ao registrar venda',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingItems) {
    return <div>Carregando itens...</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Registrar Venda</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customer">Nome do Cliente (Opcional)</Label>
            <Input
              id="customer"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>

          <div>
            <Label>Itens Disponíveis</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {menuItems?.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="outline"
                  className="p-2 text-left"
                  onClick={() => addToCart(item)}
                  disabled={item.stock <= 0}
                >
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        R$ {item.price.toFixed(2)} | Estoque: {item.stock}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {cart.length > 0 && (
            <div>
              <Label>Carrinho</Label>
              <div className="space-y-2 mt-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        R$ {item.price.toFixed(2)} x {item.quantity} = R$ {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <span>{item.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xl font-bold">
                Total: R$ {getTotal().toFixed(2)}
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={cart.length === 0 || createSale.isPending}
          >
            {createSale.isPending ? 'Registrando...' : 'Registrar Venda'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SalesForm;
