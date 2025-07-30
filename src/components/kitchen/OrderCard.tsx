
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

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
      {/* Header Compacto */}
      <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">#{order.order_number}</span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">
              #{order.order_number}
            </h3>
          </div>
          
          <Badge 
            variant={order.status === 'new' ? 'destructive' : 'default'}
            className={`${
              order.status === 'new' 
                ? 'bg-red-100 text-red-700 border-red-200' 
                : 'bg-green-100 text-green-700 border-green-200'
            } text-xs px-2 py-0.5`}
          >
            {order.status === 'new' ? 'Novo' : 'Pronto'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getTimeColor()}`}>
            <Clock className="w-2.5 h-2.5 mr-1" />
            {getElapsedTime()}
          </div>
          
          <div className="text-xs text-gray-500">
            {formatTime(order.created_at)}
          </div>
        </div>
      </div>

      {/* Conteúdo Compacto */}
      <div className="p-3">
        {/* Lista de Itens Condensada */}
        <div className="space-y-1.5 mb-3">
          {order.kitchen_order_items.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-gray-900 truncate block">
                  {item.menu_item_name}
                </span>
              </div>
              <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold text-xs ml-2">
                {item.quantity}x
              </div>
            </div>
          ))}
        </div>

        {/* Total Compacto */}
        <div className="flex justify-center mb-3">
          <div className="bg-gray-100 px-2 py-1 rounded-md">
            <span className="text-xs font-medium text-gray-700">
              {order.total_items} {order.total_items === 1 ? 'item' : 'itens'}
            </span>
          </div>
        </div>

        {/* Botão Compacto */}
        {order.status === 'new' && (
          <Button 
            onClick={handleMarkAsReady}
            disabled={updateStatus.isPending}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 rounded-md text-xs"
            size="sm"
          >
            {updateStatus.isPending ? (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                Atualizando...
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Marcar Pronto
              </div>
            )}
          </Button>
        )}

        {order.status === 'ready' && (
          <div className="text-center py-1">
            <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-md text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Pronto
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
