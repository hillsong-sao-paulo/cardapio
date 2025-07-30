
import React from 'react';
import { Button } from '@/components/ui/button';
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
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes === 1) return '1min';
    return `${diffInMinutes}min`;
  };

  const getDeliveryDuration = () => {
    if (!order.ready_at) return '';
    const created = new Date(order.created_at);
    const ready = new Date(order.ready_at);
    const diffInMinutes = Math.floor((ready.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '< 1min';
    return `${diffInMinutes}min`;
  };

  const getTimeColor = () => {
    const now = new Date();
    const created = new Date(order.created_at);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 10) return 'text-emerald-600 bg-emerald-50';
    if (diffInMinutes < 20) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
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

  if (order.status === 'new') {
    return (
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
        {/* Header - Novos Pedidos */}
        <div className="px-2 py-1.5 bg-gradient-to-r from-red-50 to-red-100/50 border-b border-red-100">
          <div className="flex justify-between items-center mb-1">
            <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">#{order.order_number}</span>
            </div>
            
            <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getTimeColor()}`}>
              <Clock className="w-2.5 h-2.5 mr-1" />
              {getElapsedTime()}
            </div>
          </div>
          
          <div className="text-xs text-gray-600 text-center">
            {formatTime(order.created_at)}
          </div>
        </div>

        {/* Conteúdo - Novos Pedidos */}
        <div className="p-2">
          {/* Lista de Itens */}
          <div className="space-y-1 mb-2">
            {order.kitchen_order_items.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-1.5 bg-gray-50 rounded text-xs">
                <span className="font-medium text-gray-900 truncate flex-1 mr-2">
                  {item.menu_item_name}
                </span>
                <div className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold text-xs">
                  {item.quantity}x
                </div>
              </div>
            ))}
          </div>

          {/* Botão */}
          <Button 
            onClick={handleMarkAsReady}
            disabled={updateStatus.isPending}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-1.5 rounded text-xs h-auto"
          >
            {updateStatus.isPending ? (
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin"></div>
                Atualizando...
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Marcar Pronto
              </div>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Pedidos Prontos
  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
      {/* Header - Pedidos Prontos */}
      <div className="px-2 py-1.5 bg-gradient-to-r from-green-50 to-green-100/50 border-b border-green-100">
        <div className="flex justify-between items-center mb-1">
          <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-green-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">#{order.order_number}</span>
          </div>
          
          <div className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-medium">
            {getDeliveryDuration()}
          </div>
        </div>
        
        <div className="text-xs text-gray-600 text-center">
          {formatTime(order.created_at)} → {order.ready_at ? formatTime(order.ready_at) : ''}
        </div>
      </div>

      {/* Conteúdo - Pedidos Prontos */}
      <div className="p-2">
        {/* Lista de Itens */}
        <div className="space-y-1">
          {order.kitchen_order_items.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-1.5 bg-gray-50 rounded text-xs">
              <span className="font-medium text-gray-900 truncate flex-1 mr-2">
                {item.menu_item_name}
              </span>
              <div className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold text-xs">
                {item.quantity}x
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
