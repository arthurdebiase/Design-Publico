import React, { useEffect } from 'react';
import { RESPONSIVE_IMAGE_SIZES, getProcessedImageUrl } from '@/lib/imageUtils';

/**
 * ResourcePreloader - Pré-carrega recursos críticos para melhorar performance LCP
 * 
 * Este componente identifica e pré-carrega recursos críticos como imagens e fontes
 * para melhorar as métricas de performance
 */
export function ResourcePreloader({ preloadImages = [] }: { preloadImages?: string[] }) {
  useEffect(() => {
    // Pré-carregar imagens críticas que foram explicitamente informadas
    const preloadSpecifiedImages = () => {
      preloadImages.forEach(imageUrl => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = imageUrl;
        link.type = 'image/webp'; // Formato padrão, o servidor decidirá o melhor formato
        link.setAttribute('fetchpriority', 'high');
        document.head.appendChild(link);
      });
    };

    // Detectar e pré-carregar automaticamente imagens críticas para LCP (Largest Contentful Paint)
    const detectAndPreloadCriticalImages = () => {
      if (document.readyState !== 'complete') {
        // Se o documento não estiver carregado, agendar para executar depois
        window.addEventListener('load', detectAndPreloadCriticalImages);
        return;
      }

      // 1. Encontrar potenciais candidatos a LCP
      // Geralmente são imagens grandes acima da dobra, no hero, etc.
      const eagerImages = Array.from(document.querySelectorAll('img[loading="eager"], img[data-priority="true"], .high-priority-image img'));
      const potentialHeroImages = Array.from(document.querySelectorAll('picture > img, section > img, .hero-image img, header img, [class*="hero"] img'));
      const potentialLCPCandidates = [...eagerImages, ...potentialHeroImages];

      // 2. Encontrar e otimizar imagens no viewport inicial
      const findImagesInViewport = () => {
        // Para cada imagem acima da dobra, aplicar otimizações
        const viewportHeight = window.innerHeight;
        document.querySelectorAll('img').forEach(img => {
          const rect = img.getBoundingClientRect();
          // Se estiver visível e acima da dobra (ou logo abaixo)
          if (rect.top < viewportHeight * 1.2) {
            // Marcar explicitamente como eager e alta prioridade
            img.setAttribute('loading', 'eager');
            img.setAttribute('fetchpriority', 'high');
            img.setAttribute('decoding', 'sync');
            
            // Adicionar dimensões específicas se não tiver
            if (!img.width || !img.height) {
              if (rect.width && rect.height) {
                img.width = Math.round(rect.width);
                img.height = Math.round(rect.height);
              }
            }
          }
        });
      };
      
      // Executar otimização para imagens no viewport inicial
      findImagesInViewport();
    };

    // Pré-carregar fontes críticas
    const preloadCriticalFonts = () => {
      const criticalFonts = [
        '/fonts/Inter-Regular.woff2',
        '/fonts/Inter-Medium.woff2'
      ];
      
      criticalFonts.forEach(fontUrl => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.href = fontUrl;
        link.type = 'font/woff2';
        link.setAttribute('crossorigin', 'anonymous');
        document.head.appendChild(link);
      });
    };

    // Função para detecção de recursos CSS não utilizados
    const detectUnusedCSS = () => {
      // Essa função seria utilizada apenas em desenvolvimento
      if (import.meta.env.MODE !== 'development') return;
      
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

    // Executar todas as otimizações
    preloadSpecifiedImages();
    detectAndPreloadCriticalImages();
    preloadCriticalFonts();
    
    // Apenas em desenvolvimento
    if (import.meta.env.MODE === 'development') {
      detectUnusedCSS();
    }
  }, [preloadImages]);

  return null;
}