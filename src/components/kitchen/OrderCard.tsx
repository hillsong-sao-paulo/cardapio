
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle } from 'lucide-react';
import { KitchenOrderWithItems } from '@/types/database';
import { useUpdateKitchenOrderStatus } from '@/hooks/useKitchenOrders';
import { useToast } from '@/hooks/use-toast';

interface OrderCardProps {
  order: KitchenOrderWithItems;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const updateStatus = useUpdateKitchenOrderStatus();
  const { toast } = useToast();

  const getElapsedTime = () => {
    const now = new Date();
    const created = new Date(order.created_at);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes === 1) return '1 minuto';
    return `${diffInMinutes} minutos`;
  };

  const getTimeColor = () => {
    const now = new Date();
    const created = new Date(order.created_at);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 10) return 'text-green-600';
    if (diffInMinutes < 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleMarkAsReady = async () => {
    try {
      await updateStatus.mutateAsync({ id: order.id, status: 'ready' });
      toast({
        title: "Pedido pronto!",
        description: `Pedido #${order.order_number} marcado como pronto.`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pedido.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">
            Pedido #{order.order_number}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={order.status === 'new' ? 'destructive' : 'default'}>
              {order.status === 'new' ? 'Novo' : 'Pronto'}
            </Badge>
            <span className={`text-sm font-medium ${getTimeColor()}`}>
              {getElapsedTime()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Pedido às {formatTime(order.created_at)}</span>
          {order.ready_at && (
            <>
              <span>•</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Pronto às {formatTime(order.ready_at)}</span>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 mb-4">
          {order.kitchen_order_items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
              <div className="flex-1">
                <span className="font-medium">{item.menu_item_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">
                  {item.quantity}x
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
          <span>Total de itens: {order.total_items}</span>
        </div>

        {order.status === 'new' && (
          <Button 
            onClick={handleMarkAsReady}
            disabled={updateStatus.isPending}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {updateStatus.isPending ? 'Atualizando...' : 'Marcar como Pronto'}
          </Button>
        )}

        {order.status === 'ready' && (
          <div className="text-center py-2">
            <Badge variant="default" className="bg-green-100 text-green-800">
              ✓ Pedido Pronto
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderCard;
