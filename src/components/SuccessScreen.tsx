
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
      {/* Backdrop com blur sutil */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      {/* Lightbox */}
      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-in">
        {/* Gradiente sutil no fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-app-blue/20 to-app-blue/5 rounded-3xl" />
        
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
          
          <h2 className="text-2xl font-bold text-white font-sf mb-2 drop-shadow-lg">
            Venda Registrada
          </h2>
          
          <p className="text-white/80 font-sf text-sm">
            Processada com sucesso
          </p>
          
          {/* Indicador de progresso sutil */}
          <div className="mt-6 flex justify-center">
            <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 rounded-full animate-[slide-in-right_3s_ease-out]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessScreen;
