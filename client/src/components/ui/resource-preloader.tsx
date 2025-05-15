import React, { useEffect } from 'react';

interface ResourcePreloaderProps {
  resources?: {
    // URLs para precarregar imagens críticas
    images?: string[];
    // URLs para DNS prefetch (domínios de terceiros)
    domains?: string[];
    // URLs para preconectar (estabelecer conexão antecipada)
    connections?: string[];
    // URLs para pré-carregar (recursos que serão necessários em breve)
    preloads?: Array<{
      url: string;
      as: 'script' | 'style' | 'image' | 'font' | 'fetch';
      type?: string;
      crossOrigin?: 'anonymous' | 'use-credentials';
    }>;
  };
}

/**
 * ResourcePreloader
 * 
 * Componente para otimizar o carregamento de recursos críticos:
 * 1. Preconnect - estabelece conexões antecipadas com origens importantes
 * 2. DNS-Prefetch - resolve DNS antecipadamente
 * 3. Preload - carrega recursos críticos com alta prioridade
 * 4. Preloadimg - carrega imagens importantes com JavaScript
 * 
 * Isso melhora significativamente as métricas LCP e FCP
 */
export const ResourcePreloader: React.FC<ResourcePreloaderProps> = ({ 
  resources = {
    // Valores padrão para recursos críticos do site
    images: [],
    domains: ['airtable.com', 'dl.airtable.com'],
    connections: ['https://dl.airtable.com'],
    preloads: [
      // Adicionar fontes críticas para o logo do site
      { 
        url: 'https://fonts.cdnfonts.com/s/30159/ArialBlack.woff',
        as: 'font',
        type: 'font/woff',
        crossOrigin: 'anonymous'
      },
      {
        url: 'https://fonts.cdnfonts.com/s/13444/Arial-Bold.woff',
        as: 'font',
        type: 'font/woff',
        crossOrigin: 'anonymous'
      }
    ]
  } 
}) => {
  // Adicionar elementos <link> para preload, preconnect, dns-prefetch
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const head = document.head || document.getElementsByTagName('head')[0];
    const linkElements: HTMLLinkElement[] = [];
    
    // 1. DNS Prefetch para domínios externos
    if (resources.domains && resources.domains.length > 0) {
      resources.domains.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = `//${domain.replace(/^https?:\/\//, '')}`;
        link.setAttribute('data-generated', 'true');
        head.appendChild(link);
        linkElements.push(link);
      });
    }
    
    // 2. Preconnect para origens externas importantes
    if (resources.connections && resources.connections.length > 0) {
      resources.connections.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        link.setAttribute('crossorigin', 'anonymous');
        link.setAttribute('data-generated', 'true');
        head.appendChild(link);
        linkElements.push(link);
      });
    }
    
    // 3. Preload para recursos críticos
    if (resources.preloads && resources.preloads.length > 0) {
      resources.preloads.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.url;
        link.as = resource.as;
        if (resource.type) link.type = resource.type;
        if (resource.crossOrigin) link.crossOrigin = resource.crossOrigin;
        link.setAttribute('data-generated', 'true');
        head.appendChild(link);
        linkElements.push(link);
      });
    }
    
    // 4. Pré-carregar imagens críticas com JavaScript
    if (resources.images && resources.images.length > 0) {
      resources.images.forEach(imageUrl => {
        // Utilizamos o Image() API para pré-carregar imagens
        const img = new Image();
        img.src = imageUrl;
      });
    }
    
    // Limpar na desmontagem
    return () => {
      linkElements.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [resources]);
  
  return null; // Componente não renderiza nada visualmente
};

export default ResourcePreloader;