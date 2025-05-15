import React, { useEffect, useRef } from 'react';

/**
 * CriticalCSS Component
 * 
 * Este componente adiciona CSS crítico diretamente no cabeçalho do documento
 * para eliminar recursos de CSS que bloqueiam a renderização e melhorar o FCP.
 * 
 * O CSS crítico deve conter apenas os estilos necessários para o conteúdo
 * acima da dobra (above-the-fold) para otimizar a velocidade de renderização.
 */
export const CriticalCSS: React.FC = () => {
  const cssInserted = useRef(false);

  useEffect(() => {
    if (cssInserted.current || typeof document === 'undefined') return;
    cssInserted.current = true;
    
    // CSS crítico para o layout principal e componentes acima da dobra
    const criticalStyles = `
      /* Importação de fontes críticas para o logo */
      @font-face {
        font-family: 'Arial Black';
        src: url('https://fonts.cdnfonts.com/s/30159/ArialBlack.woff') format('woff');
        font-display: swap;
        font-weight: 900;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'Arial';
        src: url('https://fonts.cdnfonts.com/s/13444/Arial-Bold.woff') format('woff');
        font-display: swap;
        font-weight: 700;
        font-style: normal;
      }
      
      /* Estilos críticos para layout e componentes visíveis inicialmente */
      body {
        margin: 0;
        padding: 0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .navbar {
        position: sticky;
        top: 0;
        z-index: 10;
        background-color: white;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      
      /* Otimizar layout e imagens para evitar Layout Shift */
      .app-grid, .screens-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }
      
      /* Pré-alocação para imagens de tela para evitar CLS */
      .screen-thumbnail {
        aspect-ratio: 9/16;
        background-color: #f9f9f9;
        border-radius: 0.5rem;
        overflow: hidden;
      }
      
      /* Melhorando contraste para acessibilidade */
      a {
        color: #13A15F;
        text-decoration: none;
      }
      
      /* Removendo sublinhado de links no cabeçalho e rodapé */
      header a, footer a {
        text-decoration: none !important;
      }
      
      /* Estilos para elementos de carregamento */
      .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    
    // Inserir o CSS crítico diretamente no cabeçalho
    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-critical', 'true');
    style.appendChild(document.createTextNode(criticalStyles));
    
    const head = document.head || document.getElementsByTagName('head')[0];
    head.appendChild(style);
    
    return () => {
      // Remover o CSS crítico na desmontagem (opcional, geralmente não é necessário)
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);
  
  return null; // Componente não renderiza nada visualmente
};

export default CriticalCSS;