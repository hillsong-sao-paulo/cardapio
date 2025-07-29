
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Coluna Novos Pedidos */}
      <Card className="h-full">
        <CardHeader className="bg-red-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-red-800">
              🔥 Novos Pedidos
            </CardTitle>
            <Badge variant="destructive" className="bg-red-600">
              {newOrders.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {newOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">🎉 Nenhum pedido pendente!</p>
              <p className="text-sm">Todos os pedidos foram processados.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {newOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coluna Pedidos Prontos */}
      <Card className="h-full">
        <CardHeader className="bg-green-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-green-800">
              ✅ Pedidos Prontos
            </CardTitle>
            <Badge variant="default" className="bg-green-600">
              {readyOrders.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {readyOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">⏳ Nenhum pedido pronto</p>
              <p className="text-sm">Os pedidos prontos aparecerão aqui.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {readyOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KanbanBoard;
