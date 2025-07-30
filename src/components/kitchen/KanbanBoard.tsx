
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OrderCard from './OrderCard';
import { KitchenOrderWithItems } from '@/types/database';

interface KanbanBoardProps {
  orders: KitchenOrderWithItems[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ orders }) => {
  const newOrders = orders.filter(order => order.status === 'new');
  const readyOrders = orders.filter(order => order.status === 'ready');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-full">
      {/* Coluna Novos Pedidos */}
      <div className="bg-white rounded-3xl border border-red-100 overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🔥</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Novos Pedidos
              </h2>
            </div>
            <div className="bg-white/20 rounded-full px-3 py-1.5 border border-white/30">
              <span className="text-white font-semibold text-sm">
                {newOrders.length}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-4 lg:p-6 overflow-y-auto max-h-[calc(100vh-280px)] lg:max-h-[calc(100vh-240px)]">
          {newOrders.length === 0 ? (
            <div className="text-center py-12 lg:py-16">
              <div className="w-20 h-20 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-2">
                Nenhum pedido pendente!
              </p>
              <p className="text-gray-500">
                Todos os pedidos foram processados.
              </p>
            </div>
          ) : (
            <div className="space-y-3 lg:space-y-4">
              {newOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Coluna Pedidos Prontos */}
      <div className="bg-white rounded-3xl border border-green-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">✅</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Pedidos Prontos
              </h2>
            </div>
            <div className="bg-white/20 rounded-full px-3 py-1.5 border border-white/30">
              <span className="text-white font-semibold text-sm">
                {readyOrders.length}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-4 lg:p-6 overflow-y-auto max-h-[calc(100vh-280px)] lg:max-h-[calc(100vh-240px)]">
          {readyOrders.length === 0 ? (
            <div className="text-center py-12 lg:py-16">
              <div className="w-20 h-20 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">⏳</span>
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-2">
                Nenhum pedido pronto
              </p>
              <p className="text-gray-500">
                Os pedidos prontos aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3 lg:space-y-4">
              {readyOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
