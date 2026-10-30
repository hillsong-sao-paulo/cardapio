import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { useKitchenOrders } from '@/hooks/useKitchenOrders';
import { useStoreName } from '@/hooks/useStoreName';

const OrdersDisplay: React.FC = () => {
  const { data: orders = [], isLoading, isError } = useKitchenOrders();
  const storeName = useStoreName();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const newOrders = orders.filter(order => order.status === 'new');
  
  // Filter ready orders to hide after 2 minutes
  const readyOrders = orders.filter(order => {
    if (order.status !== 'ready') return false;
    
    if (order.ready_at) {
      const readyTime = new Date(order.ready_at);
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      return readyTime > twoMinutesAgo;
    }
    
    return true;
  });

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
    <div className="h-screen flex flex-col bg-gray-300">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 px-4 md:px-8 py-4 md:py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">
              {storeName || 'Painel de Pedidos'}
            </h1>
            {isError && <p className="text-sm text-red-600 mt-1">Loja não encontrada.</p>}
            <p className="text-sm md:text-lg text-gray-600 mt-1">
              {formatDate(currentTime)}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 bg-gray-100 px-4 md:px-6 py-2 md:py-3 rounded-2xl">
            <Clock className="w-4 h-4 md:w-6 md:h-6 text-gray-700" />
            <span className="text-lg md:text-2xl font-bold text-gray-900 tabular-nums">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Preparing Orders Column */}
        <div className="bg-gray-700 text-white">
          <div className="text-center py-4 md:py-6 bg-gray-800">
            <h2 className="text-xl md:text-3xl font-bold">Preparando...</h2>
          </div>
          
          <div className="px-4 md:px-8 py-4 md:py-6">
            {newOrders.length === 0 ? (
              <div className="text-center py-8 md:py-16">
                <p className="text-lg md:text-2xl text-gray-300">Nenhum pedido em preparo</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {newOrders.map(order => (
                  <div
                    key={order.id}
                    className="text-center py-2 md:py-3"
                  >
                    <span className="text-4xl sm:text-6xl md:text-8xl font-bold text-white">
                      {order.order_number.toString().padStart(3, '0')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ready Orders Column */}
        <div className="bg-green-600 text-white">
          <div className="text-center py-4 md:py-6 bg-green-700">
            <h2 className="text-xl md:text-3xl font-bold">Pronto - Retire</h2>
          </div>
          
          <div className="px-4 md:px-8 py-4 md:py-6">
            {readyOrders.length === 0 ? (
              <div className="text-center py-8 md:py-16">
                <p className="text-lg md:text-2xl text-green-100">Nenhum pedido pronto</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {readyOrders.map(order => (
                  <div
                    key={order.id}
                    className="text-center py-2 md:py-3"
                  >
                    <span className="text-4xl sm:text-6xl md:text-8xl font-bold text-white">
                      {order.order_number.toString().padStart(3, '0')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Status */}
      <footer className="bg-white border-t border-gray-200 px-4 md:px-8 py-3 md:py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span className="text-sm md:text-base text-gray-600">
              {isLoading ? 'Carregando...' : 'Sistema Online'}
            </span>
          </div>
          <div className="text-gray-500 text-xs md:text-sm">
            Atualização automática ativa
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OrdersDisplay;
