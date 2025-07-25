
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeStock = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Configurando realtime para menu_items...');
    
    const channel = supabase
      .channel('menu-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items'
        },
        (payload) => {
          console.log('Mudança detectada no estoque:', payload);
          
          // Invalidar queries para atualizar os dados
          queryClient.invalidateQueries({ queryKey: ['menu_items'] });
          
          // Se for uma atualização, podemos ser mais específicos
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedItem = payload.new;
            console.log(`Estoque atualizado para ${updatedItem.name}: ${updatedItem.stock}`);
          }
        }
      )
      .subscribe((status) => {
        console.log('Status do canal realtime:', status);
      });

    return () => {
      console.log('Removendo canal realtime...');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
