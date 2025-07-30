
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
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes === 1) return '1 minuto';
    return `${diffInMinutes} minutos`;
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-900/5 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/10 hover:-translate-y-1">
      {/* Header do Card */}
      <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">#{order.order_number}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Pedido #{order.order_number}
              </h3>
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getTimeColor()}`}>
                <Clock className="w-3 h-3 mr-1" />
                {getElapsedTime()}
              </div>
            </div>
          </div>
          
          <Badge 
            variant={order.status === 'new' ? 'destructive' : 'default'}
            className={`${
              order.status === 'new' 
                ? 'bg-red-100 text-red-700 border-red-200 shadow-sm' 
                : 'bg-green-100 text-green-700 border-green-200 shadow-sm'
            } font-semibold px-3 py-1`}
          >
            {order.status === 'new' ? 'Novo' : 'Pronto'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Pedido às {formatTime(order.created_at)}</span>
          </div>
          {order.ready_at && (
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>Pronto às {formatTime(order.ready_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="p-5">
        {/* Lista de Itens */}
        <div className="space-y-3 mb-5">
          {order.kitchen_order_items.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex-1">
                <span className="font-semibold text-gray-900">{item.menu_item_name}</span>
              </div>
              <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold text-sm shadow-sm">
                {item.quantity}x
              </div>
            </div>
          ))}
        </div>

        {/* Total de Itens */}
        <div className="flex justify-center mb-5">
          <div className="bg-gray-100 px-4 py-2 rounded-full">
            <span className="text-sm font-semibold text-gray-700">
              Total: {order.total_items} {order.total_items === 1 ? 'item' : 'itens'}
            </span>
          </div>
        </div>

        {/* Botão de Ação */}
        {order.status === 'new' && (
          <Button 
            onClick={handleMarkAsReady}
            disabled={updateStatus.isPending}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-0.5"
            size="lg"
          >
            {updateStatus.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Atualizando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Marcar como Pronto
              </div>
            )}
          </Button>
        )}

        {order.status === 'ready' && (
          <div className="text-center py-3">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-xl font-semibold shadow-sm">
              <CheckCircle className="w-5 h-5" />
              Pedido Pronto
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
