import { useEffect } from 'react';

/**
 * ScriptOptimizer - Componente para otimização dinâmica de script loading
 * 
 * Implementa carregamento preguiçoso dinâmico de scripts baseado em interações do usuário
 * para reduzir o tempo de bloqueio total (TBT) e melhorar as métricas de performance
 */
export function ScriptOptimizer() {
  useEffect(() => {
    const loadThirdPartyScripts = () => {
      // Detectar scripts terceiros e adiar carregamento
      const thirdPartyScripts = document.querySelectorAll('script[data-defer]');
      
      thirdPartyScripts.forEach(script => {
        const originalSrc = script.getAttribute('data-src');
        if (originalSrc) {
          // Criar um novo script com o src original
          const newScript = document.createElement('script');
          newScript.src = originalSrc;
          
          // Copiar outros atributos relevantes
          Array.from(script.attributes).forEach(attr => {
            if (attr.name !== 'data-src' && attr.name !== 'data-defer') {
              newScript.setAttribute(attr.name, attr.value);
            }
          });
          
          // Substituir o script original pelo novo
          script.parentNode?.replaceChild(newScript, script);
        }
      });
    };

    const optimizeJavaScript = () => {
      // Identificar e desativar funções pesadas quando não necessárias
      // Esta é uma técnica avançada para reduzir o bloqueio de renderização
      
      // Somente executar quando o navegador estiver ocioso
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          // Exemplo: desativar animações em navegadores de baixo desempenho
          const isMobileOrTablet = window.innerWidth < 1024;
          const isLowPower = 'connection' in navigator && 
            (navigator as any).connection?.saveData === true;
          
          if (isMobileOrTablet || isLowPower) {
            // Reduzir complexidade para dispositivos de baixo desempenho
            document.body.classList.add('reduced-motion');
          }
          
          // Carregar scripts terceiros depois que a página estiver completamente carregada
          window.addEventListener('load', () => {
            setTimeout(loadThirdPartyScripts, 2000);
          });
        });
      } else {
        // Fallback para navegadores que não suportam requestIdleCallback
        setTimeout(() => {
          window.addEventListener('load', () => {
            setTimeout(loadThirdPartyScripts, 2000);
          });
        }, 1000);
      }
    };

    // Executar a otimização
    optimizeJavaScript();

    return () => {
      // Limpeza se necessário
    };
  }, []);

  return null;
}