import React, { useEffect } from 'react';

/**
 * ResourcePreloader - Pré-carrega recursos críticos para melhorar performance LCP
 * 
 * Este componente identifica e pré-carrega recursos críticos como imagens e fontes
 * para melhorar as métricas de performance
 */
export function ResourcePreloader({ preloadImages = [] }: { preloadImages?: string[] }) {
  useEffect(() => {
    // Pré-carregar imagens críticas
    const preloadCriticalImages = () => {
      preloadImages.forEach(imageUrl => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = imageUrl;
        link.type = 'image/webp'; // Assumindo WebP para melhor performance
        document.head.appendChild(link);
      });
    };

    // Função para detecção de recursos CSS não utilizados
    const detectUnusedCSS = () => {
      // Essa função seria utilizada apenas em desenvolvimento
      if (process.env.NODE_ENV !== 'development') return;
      
      // Esperar DOM carregar completamente
      setTimeout(() => {
        const allStyleSheets = Array.from(document.styleSheets);
        const usedSelectors: Set<string> = new Set();
        const unusedSelectors: string[] = [];
        
        // Para cada stylesheet no documento
        allStyleSheets.forEach(sheet => {
          try {
            // Tentar acessar as regras CSS (pode falhar devido a CORS)
            const rules = Array.from(sheet.cssRules || []);
            
            rules.forEach(rule => {
              // Verificar apenas regras de estilo
              if (rule instanceof CSSStyleRule) {
                const selector = rule.selectorText;
                
                try {
                  // Tentar encontrar elementos que correspondam ao seletor
                  const elements = document.querySelectorAll(selector);
                  if (elements.length > 0) {
                    usedSelectors.add(selector);
                  } else {
                    unusedSelectors.push(selector);
                  }
                } catch (e) {
                  // Ignorar erros de seletores inválidos
                }
              }
            });
          } catch (e) {
            // Ignorar erros de CORS em stylesheets externos
          }
        });
        
        // Registrar seletores não utilizados para otimização
        if (unusedSelectors.length > 0) {
          console.log('Seletores CSS potencialmente não utilizados:', unusedSelectors.length);
        }
      }, 3000);
    };

    // Executar otimizações
    preloadCriticalImages();
    detectUnusedCSS();
  }, [preloadImages]);

  return null;
}