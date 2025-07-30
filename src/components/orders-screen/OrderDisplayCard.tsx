
import React from 'react';
import { Clock } from 'lucide-react';
import { KitchenOrderWithItems } from '@/types/database';

interface OrderDisplayCardProps {
  order: KitchenOrderWithItems;
}

const OrderDisplayCard: React.FC<OrderDisplayCardProps> = ({ order }) => {
  const getElapsedTime = () => {
    const now = new Date();
    const created = new Date(order.created_at);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes === 1) return '1 min';
    return `${diffInMinutes} min`;
  };

  const getStatusColor = () => {
    if (order.status === 'ready') {
      return 'bg-green-500 border-green-400 text-white';
    }
    
    const now = new Date();
    const created = new Date(order.created_at);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 10) return 'bg-orange-500 border-orange-400 text-white';
    if (diffInMinutes < 20) return 'bg-yellow-500 border-yellow-400 text-white';
    return 'bg-red-500 border-red-400 text-white';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`rounded-3xl border-4 p-8 transition-all duration-300 ${getStatusColor()}`}>
      {/* Order Number - Large and Prominent */}
      <div className="text-center mb-6">
        <div className="text-7xl font-black mb-2 tracking-tight">
          #{order.order_number}
        </div>
        <div className="flex items-center justify-center gap-2 text-lg opacity-90">
          <Clock className="w-5 h-5" />
          <span className="font-semibold">{getElapsedTime()}</span>
        </div>
      </div>

      {/* Order Details */}
      <div className="space-y-4">
        {/* Items Summary */}
        <div className="bg-white/20 rounded-2xl p-4">
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">
              {order.total_items} {order.total_items === 1 ? 'Item' : 'Itens'}
            </div>
            <div className="space-y-1">
              {order.kitchen_order_items.slice(0, 3).map((item, index) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="font-medium truncate">{item.menu_item_name}</span>
                  <span className="ml-2 font-bold">{item.quantity}x</span>
                </div>
              ))}
              {order.kitchen_order_items.length > 3 && (
                <div className="text-center text-sm opacity-80 pt-1">
                  +{order.kitchen_order_items.length - 3} mais
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="flex justify-between items-center text-sm opacity-90">
          <div>
            <div className="font-medium">Pedido</div>
            <div>{formatTime(order.created_at)}</div>
          </div>
          {order.ready_at && (
            <div className="text-right">
              <div className="font-medium">Pronto</div>
              <div>{formatTime(order.ready_at)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Status Badge */}
      {order.status === 'ready' && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/30 px-6 py-3 rounded-full">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-bold text-lg">PRONTO PARA RETIRADA</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDisplayCard;
