
import React from 'react';
import SalesForm from '@/components/SalesForm';
import SEO from '@/components/SEO';

const Index: React.FC = () => {
  return (
    <>
      <SEO 
        title="Cardápio Digital Outback - Encounterfest 2025"
        description="Sistema de vendas do cardápio digital do Outback para o Encounterfest 2025 no Lounge do Office da igreja Hillsong. Faça seu pedido online com praticidade."
      />
      
      <SalesForm />
    </>
  );
};

export default Index;
