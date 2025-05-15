import { useEffect } from 'react';

/**
 * Estilos críticos para renderização inicial da página
 * Estes estilos são essenciais para o layout inicial e evitam cumulative layout shift
 * Incluindo apenas o que é necessário para a renderização above-the-fold
 */
const criticalStyles = `
  /* Estilos críticos para o layout e componentes iniciais */
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f7f7f7;
  }
  
  /* Estilos críticos para o header/navbar */
  .header {
    position: sticky;
    top: 0;
    z-index: 50;
    background-color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    padding: 0.75rem 1rem;
  }
  
  /* Estilos para skeleton loading states */
  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #f5f5f5 37%, #f0f0f0 63%);
    animation: skeleton-loading 1.4s ease infinite;
    background-size: 400% 100%;
  }
  
  @keyframes skeleton-loading {
    0% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
  }
  
  /* Container padrão que centraliza o conteúdo */
  .container {
    width: 100%;
    max-width: 1280px;
    margin-left: auto;
    margin-right: auto;
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  /* Estilos críticos para a grid no layout masonry */
  .masonry-grid {
    display: grid;
    grid-gap: 1.5rem;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  /* Estilos básicos para os cards de app */
  .app-card {
    background-color: white;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  /* Estilos para as imagens com lazy loading */
  img {
    max-width: 100%;
    height: auto;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  img.loaded {
    opacity: 1;
  }
`;

/**
 * CriticalCSS - Componente para injetar estilos críticos e carregar não críticos assíncronamente
 * 
 * Este componente injeta os estilos críticos diretamente no head para renderização imediata
 * e carrega estilos adicionais após o carregamento inicial da página
 * para melhorar FCP (First Contentful Paint) e LCP (Largest Contentful Paint)
 */
export function CriticalCSS() {
  useEffect(() => {
    // Injetar estilos críticos diretamente no head
    if (!document.getElementById('critical-css')) {
      const style = document.createElement('style');
      style.id = 'critical-css';
      style.innerHTML = criticalStyles;
      
      // Inserir no topo do head para aplicação imediata
      if (document.head.firstChild) {
        document.head.insertBefore(style, document.head.firstChild);
      } else {
        document.head.appendChild(style);
      }
    }

    // Função para carregar CSS de forma assíncrona (não bloqueante)
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
    
    // Otimização para garantir que estilos sejam carregados corretamente
    // quando o usuário interage ou quando o navegador está inativo
    const loadDeferred = () => {
      // Procurar por folhas de estilo que podem ter sido marcadas para carregar mais tarde
      document.querySelectorAll('link[rel="stylesheet"][media="print"]').forEach(link => {
        link.setAttribute('media', 'all');
      });
      
      // Remover críticos após carregar todos os estilos
      // para evitar conflitos de especificidade
      setTimeout(() => {
        const criticalCss = document.getElementById('critical-css');
        if (criticalCss && criticalCss.parentNode) {
          criticalCss.parentNode.removeChild(criticalCss);
        }
      }, 2000);
    };

    // Observar quando o usuário está inativo para carregar CSS não crítico
    // Isso é melhor para UX do que setTimeout fixo
    const idleCallback = () => {
      loadDeferred();
      
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

    // Observar a primeira interação do usuário para carregar estilos restantes
    const interactionEvents = ['click', 'mouseover', 'keydown', 'touchmove', 'scroll'];
    
    const handleUserInteraction = () => {
      loadDeferred();
      // Remover event listeners após a primeira interação
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
    
    // Adicionar listeners para detectar interação
    interactionEvents.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true, passive: true });
    });

    // Usar requestIdleCallback ou setTimeout como fallback
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(idleCallback);
      (window as any)._idleCallbackId = id;
    } else {
      // Fallback para navegadores que não suportam requestIdleCallback
      setTimeout(idleCallback, 1000);
    }

    return () => {
      if ('cancelIdleCallback' in window && (window as any)._idleCallbackId) {
        (window as any).cancelIdleCallback((window as any)._idleCallbackId);
      }
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, []);

  return null;
}