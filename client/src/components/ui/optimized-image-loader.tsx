import { useEffect } from 'react';

/**
 * Componente para otimizar o carregamento de imagens
 * 
 * Este componente implementa otimizações avançadas para o carregamento de imagens:
 * 1. Prioriza imagens LCP (Largest Contentful Paint)
 * 2. Implementa lazy loading para imagens abaixo da barra de rolagem
 * 3. Detecta suporte a formatos modernos (WebP, AVIF)
 * 4. Pré-carrega imagens de tela que provavelmente serão vistas em seguida
 */
export function OptimizedImageLoader() {
  useEffect(() => {
    // Detecta se o navegador suporta os novos formatos de imagem
    const detectImageSupport = async () => {
      // Detectar suporte a WebP
      const webpSupport = document.createElement('canvas')
        .toDataURL('image/webp')
        .indexOf('data:image/webp') === 0;
      
      // Detectar suporte a AVIF (mais complexo, verifica se o browser pode decodificar uma imagem AVIF)
      let avifSupport = false;
      try {
        const avifData = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
        const img = new Image();
        img.src = avifData;
        await new Promise((resolve) => {
          img.onload = () => {
            avifSupport = (img.width > 0) && (img.height > 0);
            resolve(avifSupport);
          };
          img.onerror = () => {
            resolve(false);
          };
        });
      } catch (e) {
        avifSupport = false;
      }

      // Armazena a informação para ser usada pelo proxy de imagens
      document.documentElement.dataset.webp = webpSupport.toString();
      document.documentElement.dataset.avif = avifSupport.toString();
      
      // Log para debugging
      console.log(`Browser suporta: WebP=${webpSupport}, AVIF=${avifSupport}`);
    };

    // Implementa o carregamento de imagens em fases, para melhorar o LCP
    const optimizeImageLoading = () => {
      // Primeiro, processa apenas imagens com fetchpriority='high' (LCP)
      const highPriorityImages = document.querySelectorAll('img[fetchpriority="high"]');
      
      // Depois, processa imagens com loading='eager' (acima da dobra)
      const eagerImages = document.querySelectorAll('img[loading="eager"]:not([fetchpriority="high"])');
      
      // Implementa um IntersectionObserver para lazy loading avançado
      if ('IntersectionObserver' in window) {
        const lazyImageObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const lazyImage = entry.target as HTMLImageElement;
              if (lazyImage.dataset.src) {
                lazyImage.src = lazyImage.dataset.src;
                delete lazyImage.dataset.src;
              }
              if (lazyImage.dataset.srcset) {
                lazyImage.srcset = lazyImage.dataset.srcset;
                delete lazyImage.dataset.srcset;
              }
              lazyImage.classList.add('opacity-100');
              lazyImage.classList.remove('opacity-0');
              lazyImageObserver.unobserve(lazyImage);
            }
          });
        }, {
          rootMargin: '200px 0px', // Carrega imagens quando estão a 200px de entrar na tela
          threshold: 0.01 // Dispara quando pelo menos 1% da imagem está visível
        });
        
        // Encontra e observa imagens com loading='lazy'
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach((lazyImage) => {
          lazyImageObserver.observe(lazyImage);
        });
      }
      
      // Pré-carregamento inteligente de imagens que provavelmente serão visualizadas
      const preloadImagesOnIdle = () => {
        // Implementa uma estratégia de pré-carregamento que não afeta o desempenho
        const idleCallback = () => {
          // Encontra imagens acima da dobra que ainda não foram carregadas
          const visibleImages = Array.from(document.querySelectorAll('img[loading="lazy"]'))
            .filter((img) => {
              const rect = img.getBoundingClientRect();
              return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
              );
            });
          
          // Pré-carrega estas imagens
          visibleImages.forEach((img: HTMLImageElement) => {
            if (img.dataset.src) {
              const preloadLink = document.createElement('link');
              preloadLink.rel = 'preload';
              preloadLink.as = 'image';
              preloadLink.href = img.dataset.src;
              document.head.appendChild(preloadLink);
            }
          });
        };
        
        // Usa requestIdleCallback se disponível, caso contrário setTimeout
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(idleCallback, { timeout: 2000 });
        } else {
          setTimeout(idleCallback, 2000);
        }
      };
      
      // Adicionar eventos para detectar quando o usuário está prestes a interagir
      // com elementos que mostrarão imagens adicionais (hover, etc)
      document.addEventListener('mouseover', (e) => {
        const target = e.target as HTMLElement;
        // Verifica se o target é um elemento que pode revelar mais imagens
        if (target.closest('a') || target.closest('button') || target.closest('.clickable')) {
          preloadImagesOnIdle();
        }
      }, { passive: true });
    };

    // Executa as funções de otimização
    detectImageSupport();
    optimizeImageLoading();
    
    // Adiciona detecção automática de imagens LCP para otimizações futuras
    if ('PerformanceObserver' in window) {
      // Observe LCP
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          // Se o elemento LCP for uma imagem, marca para uso futuro
          if (lastEntry && 'element' in lastEntry) {
            const element = (lastEntry as any).element;
            if (element && element.tagName === 'IMG') {
              element.setAttribute('data-lcp', 'true');
              console.log('LCP image detected:', element.src);
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
    
    return () => {
      // Cleanup se necessário
    };
  }, []);

  return null;
}