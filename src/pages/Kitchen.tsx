
import React, { useEffect, useState } from 'react';
import { useKitchenOrders } from '@/hooks/useKitchenOrders';
import KanbanBoard from '@/components/kitchen/KanbanBoard';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Kitchen: React.FC = () => {
  const { data: orders = [], isLoading, refetch } = useKitchenOrders();
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Som de notificação para novos pedidos
  const playNotificationSound = () => {
    if (soundEnabled) {
      // Cria um beep simples usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequência do beep
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  };

  // Configurar realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('kitchen-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'kitchen_orders'
      }, (payload) => {
        console.log('Novo pedido na cozinha:', payload);
        playNotificationSound();
        refetch();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'kitchen_orders'
      }, (payload) => {
        console.log('Pedido atualizado:', payload);
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, soundEnabled]);

  // Detectar novos pedidos para tocar som
  useEffect(() => {
    const newOrdersCount = orders.filter(order => order.status === 'new').length;
    
    if (lastOrderCount > 0 && newOrdersCount > lastOrderCount) {
      playNotificationSound();
    }
    
    setLastOrderCount(newOrdersCount);
  }, [orders, lastOrderCount, soundEnabled]);

  const newOrdersCount = orders.filter(order => order.status === 'new').length;
  const readyOrdersCount = orders.filter(order => order.status === 'ready').length;
  const totalOrders = orders.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pedidos da cozinha...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da cozinha */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <img 
                  src="/lovable-uploads/d8797de3-f66c-4df1-be7a-6f33464353d3.png" 
                  alt="Hillsong Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🍴 Cozinha</h1>
                <p className="text-sm text-gray-500">
                  Sistema de Pedidos - {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Estatísticas rápidas */}
              <div className="hidden md:flex items-center gap-3">
                <Badge variant="destructive" className="text-sm">
                  {newOrdersCount} Novos
                </Badge>
                <Badge variant="default" className="text-sm bg-green-600">
                  {readyOrdersCount} Prontos
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {totalOrders} Total
                </Badge>
              </div>

              {/* Controles */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="flex items-center gap-2"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {soundEnabled ? 'Som On' : 'Som Off'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>
          </div>

          {/* Estatísticas mobile */}
          <div className="md:hidden flex items-center gap-3 mt-3">
            <Badge variant="destructive" className="text-sm">
              {newOrdersCount} Novos
            </Badge>
            <Badge variant="default" className="text-sm bg-green-600">
              {readyOrdersCount} Prontos
            </Badge>
            <Badge variant="outline" className="text-sm">
              {totalOrders} Total
            </Badge>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="p-6">
        {totalOrders === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Nenhum pedido no momento
            </h2>
            <p className="text-gray-500">
              Os novos pedidos aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <KanbanBoard orders={orders} />
        )}
      </div>

      {/* Rodapé */}
      <footer className="bg-white border-t border-gray-200 mt-8 py-4">
        <div className="px-6">
          <div className="flex items-center justify-center">
            <img 
              src="/lovable-uploads/397f96e7-0d6d-4eb1-a7f9-2d0c8fff89fd.png" 
              alt="Hillsong São Paulo" 
              className="h-6 opacity-60"
            />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Kitchen;
