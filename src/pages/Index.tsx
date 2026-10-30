
import React from 'react';
import SalesForm from '@/components/SalesForm';
import SEO from '@/components/SEO';
import { useStoreName } from '@/hooks/useStoreName';

const Index: React.FC = () => {
  const storeName = useStoreName();
  const title = storeName || 'Cantina';

  return (
    <>
      <SEO
        plain
        title={title}
        description={`Cardápio de ${title}. Faça seu pedido no balcão.`}
      />
      <SalesForm storeName={storeName} />
    </>
  );
};

export default Index;
