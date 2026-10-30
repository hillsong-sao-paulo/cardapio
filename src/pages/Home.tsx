import React from 'react';
import { Helmet } from 'react-helmet-async';

const Home: React.FC = () => {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <Helmet>
        <title>Cantina</title>
      </Helmet>
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">Cantina</h1>
        <p className="text-gray-600">
          Abra o link da loja para ver o cardápio, a cozinha ou os pedidos.
        </p>
        <p className="text-sm text-gray-500">O link começa com /s/ e o nome da loja.</p>
      </div>
    </main>
  );
};

export default Home;
