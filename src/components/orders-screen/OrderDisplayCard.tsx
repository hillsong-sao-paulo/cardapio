
import React from 'react';
import { KitchenOrderWithItems } from '@/types/database';

interface OrderDisplayCardProps {
  order: KitchenOrderWithItems;
}

const OrderDisplayCard: React.FC<OrderDisplayCardProps> = ({ order }) => {
  const isReady = order.status === 'ready';

  return (
    <div className={`w-full p-6 rounded-lg border-2 transition-all duration-300 ${
      isReady 
        ? 'bg-green-100 border-green-400' 
        : 'bg-white border-gray-300'
    }`}>
      <div className="flex items-center justify-between">
        {/* Número do pedido */}
        <div className="text-6xl font-black text-black">
          #{order.order_number}
        </div>
        
        {/* Status */}
        <div className={`px-6 py-3 rounded-full text-lg font-bold ${
          isReady 
            ? 'bg-green-500 text-white' 
            : 'bg-gray-300 text-gray-700'
        }`}>
          {isReady ? 'PRONTO' : 'PREPARANDO'}
        </div>
      </div>
    </div>
  );
};

export default OrderDisplayCard;
