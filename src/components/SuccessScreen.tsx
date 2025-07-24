
import React, { useState, useEffect } from 'react';

interface SuccessScreenProps {
  isVisible: boolean;
  onClose: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ isVisible, onClose }) => {
  const [showHappyFace, setShowHappyFace] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Reseta o estado quando a tela aparece
      setShowHappyFace(false);
      
      // Transiciona para cara feliz após 1 segundo
      const iconTimer = setTimeout(() => {
        setShowHappyFace(true);
      }, 1000);

      // Auto-dismiss após 3 segundos
      const dismissTimer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => {
        clearTimeout(iconTimer);
        clearTimeout(dismissTimer);
      };
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop sólido */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Lightbox */}
      <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-in">
        {/* Conteúdo */}
        <div className="relative text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div 
                className={`text-7xl transition-all duration-500 ${
                  showHappyFace ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                }`}
              >
                👍
              </div>
              <div 
                className={`absolute inset-0 text-7xl transition-all duration-500 ${
                  showHappyFace ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                }`}
              >
                😊
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 font-sf mb-2">
            Venda Registrada
          </h2>
          
          <p className="text-gray-600 font-sf text-sm">
            Processada com sucesso
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessScreen;
