
import React from 'react';
import { Helmet } from 'react-helmet-async';
import OrdersDisplay from '@/components/orders-screen/OrdersDisplay';

const OrdersScreen: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Painel de Pedidos - Display</title>
        <meta name="description" content="Tela de exibição pública dos pedidos" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <OrdersDisplay />
      </div>
    </>
  );
};

export default OrdersScreen;
