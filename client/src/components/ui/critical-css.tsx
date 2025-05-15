import { useEffect } from 'react';

/**
 * CriticalCSS - Componente para carregar estilos não críticos de forma assíncrona
 * 
 * Este componente carrega estilos adicionais após o carregamento inicial da página
 * para melhorar o First Contentful Paint e Largest Contentful Paint
 */
export function CriticalCSS() {
  useEffect(() => {
    // Função para carregar CSS de forma assíncrona
    const loadStylesheet = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      // Marcar como não bloqueante para renderização
      link.setAttribute('media', 'print');
      // Quando carregado, aplicar para todas as mídias
      link.onload = () => {
        link.setAttribute('media', 'all');
      };
      document.head.appendChild(link);
    };

    // Observar quando o usuário está inativo para carregar CSS não crítico
    // Isso é melhor para UX do que setTimeout fixo
    const idleCallback = () => {
      // Carregar estilos adicionais aqui, exemplo:
      // loadStylesheet('/path/to/non-critical.css');
      
      // Pré-carregar fontes agora em vez de bloquear a renderização inicial
      const fontPreloads = document.querySelectorAll('link[rel="preload"][as="font"]');
      fontPreloads.forEach((preload) => {
        const href = preload.getAttribute('href');
        if (href) {
          const fontLink = document.createElement('link');
          fontLink.rel = 'stylesheet';
          fontLink.href = href;
          document.head.appendChild(fontLink);
        }
      });
    };

    // Usar requestIdleCallback ou setTimeout como fallback
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(idleCallback);
    } else {
      // Fallback para navegadores que não suportam requestIdleCallback
      setTimeout(idleCallback, 1000);
    }

    return () => {
      if ('cancelIdleCallback' in window && (window as any)._idleCallbackId) {
        (window as any).cancelIdleCallback((window as any)._idleCallbackId);
      }
    };
  }, []);

  return null;
}