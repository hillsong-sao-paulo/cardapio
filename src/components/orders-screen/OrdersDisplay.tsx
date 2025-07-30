
import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
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

  const newOrders = orders.filter(order => order.status === 'new');
  const readyOrders = orders.filter(order => order.status === 'ready');

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Painel de Pedidos
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              {formatDate(currentTime)}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-gray-100 px-6 py-3 rounded-2xl">
            <Clock className="w-6 h-6 text-gray-700" />
            <span className="text-2xl font-bold text-gray-900 tabular-nums">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
        {/* New Orders Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <h2 className="text-3xl font-bold text-gray-900">
              Preparando
            </h2>
            <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full font-bold text-lg">
              {newOrders.length}
            </div>
          </div>
          
          <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
            {newOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">🍽️</span>
                </div>
                <p className="text-xl text-gray-600">Nenhum pedido em preparo</p>
              </div>
            ) : (
              newOrders.map(order => (
                <OrderDisplayCard key={order.id} order={order} />
              ))
            )}
          </div>
        </div>

        {/* Ready Orders Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <h2 className="text-3xl font-bold text-gray-900">
              Pronto para Retirada
            </h2>
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-lg">
              {readyOrders.length}
            </div>
          </div>
          
          <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
            {readyOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">✅</span>
                </div>
                <p className="text-xl text-gray-600">Nenhum pedido pronto</p>
              </div>
            ) : (
              readyOrders.map(order => (
                <OrderDisplayCard key={order.id} order={order} />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Footer Status */}
      <footer className="bg-white border-t border-gray-200 px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span className="text-gray-600">
              {isLoading ? 'Carregando...' : 'Sistema Online'}
            </span>
          </div>
          <div className="text-gray-500 text-sm">
            Atualização automática ativa
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OrdersDisplay;
