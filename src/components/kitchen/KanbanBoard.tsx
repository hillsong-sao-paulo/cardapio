
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 h-full">
      {/* Coluna Novos Pedidos */}
      <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🔥</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Novos Pedidos
              </h2>
            </div>
            <div className="bg-white/20 rounded-full px-2 py-1 border border-white/30">
              <span className="text-white font-semibold text-sm">
                {newOrders.length}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-3 overflow-y-auto max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-160px)]">
          {newOrders.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <span className="text-xl">🎉</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1">
                Nenhum pedido pendente!
              </p>
              <p className="text-xs text-gray-500">
                Todos os pedidos foram processados.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {newOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Coluna Pedidos Prontos */}
      <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✅</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Pedidos Prontos
              </h2>
            </div>
            <div className="bg-white/20 rounded-full px-2 py-1 border border-white/30">
              <span className="text-white font-semibold text-sm">
                {readyOrders.length}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-3 overflow-y-auto max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-160px)]">
          {readyOrders.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <span className="text-xl">⏳</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1">
                Nenhum pedido pronto
              </p>
              <p className="text-xs text-gray-500">
                Os pedidos prontos aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
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
