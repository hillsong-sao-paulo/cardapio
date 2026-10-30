
import React from 'react';
import { Helmet } from 'react-helmet-async';
import OrdersDisplay from '@/components/orders-screen/OrdersDisplay';
import { useStoreName } from '@/hooks/useStoreName';

const OrdersScreen: React.FC = () => {
  const storeName = useStoreName();
  const title = storeName ? `${storeName} · Pedidos` : 'Painel de Pedidos';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content="Tela de exibição pública dos pedidos" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <OrdersDisplay />
      </div>
    </>
  );
};

export default OrdersScreen;
