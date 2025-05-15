import { useEffect } from 'react';

/**
 * ResourcePreloader Component
 * 
 * Este componente implementa estratégias de pré-carregamento para melhorar performance:
 * - Pré-carrega imagens críticas para LCP (Largest Contentful Paint)
 * - Implementa DNS prefetch para domínios externos
 * - Implementa preconnect para conexões que serão necessárias logo
 * - Detecta e prioriza automaticamente elementos importantes
 */
export function ResourcePreloader() {
  useEffect(() => {
    // Detectar imagens críticas para Largest Contentful Paint (LCP)
    const detectLcpCandidates = (): HTMLImageElement[] => {
      // Estratégias para encontrar elementos LCP potenciais
      const candidates: HTMLImageElement[] = [];
      
      // 1. Imagens grandes acima da dobra são frequentemente LCP
      document.querySelectorAll('img').forEach((img) => {
        const rect = img.getBoundingClientRect();
        
        // Imagem visível e razoavelmente grande (provavelmente LCP)
        if (
          rect.top < window.innerHeight &&
          rect.width > 100 &&
          rect.height > 100
        ) {
          candidates.push(img);
        }
      });
      
      // 2. Imagem com classes que sugerem destaque (hero, banner, etc)
      document.querySelectorAll('img.hero, img.banner, img.featured').forEach((img) => {
        if (!candidates.includes(img as HTMLImageElement)) {
          candidates.push(img as HTMLImageElement);
        }
      });
      
      // 3. Ordena por área visível (maior primeiro = mais provável LCP)
      return candidates.sort((a, b) => {
        const areaA = a.width * a.height;
        const areaB = b.width * b.height;
        return areaB - areaA;
      });
    };

    // Preload de recursos críticos
    const preloadCriticalResources = () => {
      // Obter candidatos LCP
      const lcpCandidates = detectLcpCandidates();
      
      // Preload das principais imagens (Top 3)
      lcpCandidates.slice(0, 3).forEach((img) => {
        // Só pré-carrega se tiver src e não estiver com loading=eager
        if (img.src && img.loading !== 'eager' && !img.hasAttribute('fetchpriority')) {
          // Marca como alta prioridade
          img.setAttribute('fetchpriority', 'high');
          img.loading = 'eager';
          
          // Também pré-carrega usando link preload
          if (!document.querySelector(`link[rel="preload"][href="${img.src}"]`)) {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            preloadLink.href = img.src;
            preloadLink.crossOrigin = 'anonymous';
            document.head.appendChild(preloadLink);
          }
        }
      });
      
      // Preconnect para domínios de imagens
      const airtableDomain = 'v5.airtableusercontent.com';
      if (!document.querySelector(`link[rel="preconnect"][href="https://${airtableDomain}"]`)) {
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = `https://${airtableDomain}`;
        preconnect.crossOrigin = 'anonymous';
        document.head.appendChild(preconnect);
      }
    };

    // Preload de recursos relacionados ao LCP (usando PerformanceObserver)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          if (lastEntry && 'element' in lastEntry) {
            const element = (lastEntry as any).element;
            
            // Se o LCP for uma imagem, marcar para otimização futura
            if (element && element.tagName === 'IMG') {
              // Verifica se há imagens semelhantes para pré-carregar
              const src = element.src;
              const pathname = new URL(src).pathname;
              const pathParts = pathname.split('/');
              const filename = pathParts[pathParts.length - 1];
              
              // Detecta arquivos similares (mesmo padrão de nome)
              const similarPattern = filename.replace(/\d+/g, '\\d+');
              const regex = new RegExp(similarPattern);
              
              // Encontra e preload de imagens semelhantes
              document.querySelectorAll('img').forEach((img) => {
                if (img !== element && img.src && regex.test(img.src)) {
                  const preloadLink = document.createElement('link');
                  preloadLink.rel = 'preload';
                  preloadLink.as = 'image';
                  preloadLink.href = img.src;
                  document.head.appendChild(preloadLink);
                }
              });
            }
          }
          
          lcpObserver.disconnect();
        });
        
        // Registra o observer para o tipo LCP
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        console.warn('PerformanceObserver for LCP not supported', e);
      }
    }
    
    // Executa o preload inicial
    preloadCriticalResources();
    
    // Re-executar quando necessário (após lazy load ou atualização dinâmica)
    window.addEventListener('lazyloaded', preloadCriticalResources);
    
    return () => {
      window.removeEventListener('lazyloaded', preloadCriticalResources);
    };
  }, []);

  return null;
}