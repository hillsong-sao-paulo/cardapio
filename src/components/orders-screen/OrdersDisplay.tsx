
import React, { useEffect, useState } from 'react';
import { useKitchenOrders } from '@/hooks/useKitchenOrders';
import OrderDisplayCard from './OrderDisplayCard';

const OrdersDisplay: React.FC = () => {
  const { data: orders = [], isLoading } = useKitchenOrders();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header simples */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Pedidos
        </h1>
        <div className="text-lg text-gray-600">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Lista de todos os pedidos */}
      <div className="max-w-4xl mx-auto space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl text-gray-500">Nenhum pedido no momento</p>
          </div>
        ) : (
          orders.map(order => (
            <OrderDisplayCard key={order.id} order={order} />
          ))
        )}
      </div>

      {/* Status footer simples */}
      <div className="fixed bottom-4 right-4">
        <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
      </div>
    </div>
  );
};

export default OrdersDisplay;
