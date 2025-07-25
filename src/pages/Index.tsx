
import React from 'react';
import { CategoryTabs } from '@/components/CategoryTabs';
import { SalesForm } from '@/components/SalesForm';
import { CartSidebar } from '@/components/CartSidebar';
import { useCart } from '@/hooks/useCart';
import { SuccessScreen } from '@/components/SuccessScreen';
import { useState } from 'react';
import SEO from '@/components/SEO';

const Index: React.FC = () => {
  const { cart } = useCart();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSaleSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  if (showSuccess) {
    return <SuccessScreen onClose={() => setShowSuccess(false)} />;
  }

  return (
    <>
      <SEO 
        title="Cardápio Digital Outback - Encounterfest 2025"
        description="Sistema de vendas do cardápio digital do Outback para o Encounterfest 2025 no Lounge do Office da igreja Hillsong. Faça seu pedido online com praticidade."
      />
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <SalesForm onSaleSuccess={handleSaleSuccess} />
            <CategoryTabs />
          </div>
        </div>
        
        <CartSidebar />
      </div>
    </>
  );
};

export default Index;
