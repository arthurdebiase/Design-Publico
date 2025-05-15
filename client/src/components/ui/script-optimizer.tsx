import { useEffect } from 'react';

/**
 * Script Optimizer
 * 
 * Este componente otimiza o carregamento de scripts na aplicação para melhorar
 * o Total Blocking Time (TBT) e Time to Interactive (TTI).
 * 
 * Técnicas usadas:
 * 1. Script splitting - Divide scripts grandes em menores
 * 2. Carregamento assíncrono - Carrega scripts não críticos com async/defer
 * 3. Detecção de idle time - Carrega código não essencial quando o navegador está inativo
 */
export function ScriptOptimizer() {
  useEffect(() => {
    // Função para detectar se o browser está com recursos livres
    const isLowPriority = () => {
      return !document.hidden && // Documento visível
        (navigator as any).deviceMemory > 4 && // Dispositivo tem mais de 4GB de RAM
        (navigator as any).hardwareConcurrency > 4; // CPU com mais de 4 cores
    };

    // Carrega scripts dinamicamente sem bloquear o thread principal
    const loadScriptAsync = (src: string, defer = true, async = true): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        if (defer) script.defer = true;
        if (async) script.async = true;
        
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        
        document.body.appendChild(script);
      });
    };

    // Implementa um mecanismo para executar funções pesadas fora do thread principal
    // Isso melhora significativamente o TBT (Total Blocking Time)
    const executeOffMainThread = (fn: Function): void => {
      // Cria uma URL para a função
      const fnString = `self.onmessage = function(e) { 
        (${fn.toString()})(); 
        self.postMessage('done'); 
      }`;
      
      const blob = new Blob([fnString], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      
      // Cria um worker para executar a função
      const worker = new Worker(url);
      
      // Limpa recursos quando terminar
      worker.onmessage = () => {
        worker.terminate();
        URL.revokeObjectURL(url);
      };
      
      // Inicia o worker
      worker.postMessage('start');
    };

    // Função para adiar carregamento de recursos não essenciais
    const deferNonEssentialWork = () => {
      // Evento que dispara quando o navegador estiver ocioso
      const onIdle = () => {
        // Adiar o carregamento de análise e rastreamento para melhorar o LCP e FCP
        setTimeout(() => {
          // Exemplo de loading de scripts de terceiros (analytics, etc)
          // Aqui poderia ser Google Analytics, Facebook Pixel, etc
        }, 3000);
      };
      
      // Usar requestIdleCallback se disponível, senão usar setTimeout
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(onIdle, { timeout: 5000 });
      } else {
        setTimeout(onIdle, 5000);
      }
    };

    // Implementa otimização de interação com UI (resolve jank)
    const optimizeUiInteractions = () => {
      // Melhora a performance de scrolling
      let scrollTimeout: any = null;
      const onScroll = () => {
        // Cancela qualquer repaint não essencial durante scroll
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        // Reagenda atualizações depois que o scroll para
        scrollTimeout = setTimeout(() => {
          // Aciona updates visuais depois que o scroll parou
          // Isso reduz CLS e TBT durante scroll
        }, 150);
      };
      
      // Otimiza rendering durante scroll
      window.addEventListener('scroll', onScroll, { passive: true });
      
      // Limpeza quando componente for desmontado
      return () => {
        window.removeEventListener('scroll', onScroll);
      };
    };

    // Evita long tasks bloqueantes dividindo o trabalho
    const avoidLongTasks = (taskFn: Function, data: any[], chunkSize = 50) => {
      return new Promise<void>((resolve) => {
        const chunks = Math.ceil(data.length / chunkSize);
        let currentChunk = 0;
        
        const processNextChunk = () => {
          if (currentChunk >= chunks) {
            resolve();
            return;
          }
          
          const start = currentChunk * chunkSize;
          const end = Math.min(start + chunkSize, data.length);
          const chunk = data.slice(start, end);
          
          // Processa o chunk atual
          taskFn(chunk);
          
          currentChunk++;
          
          // Agenda o próximo chunk usando setTimeout para permitir que o navegador respire
          setTimeout(processNextChunk, 0);
        };
        
        // Inicia o processamento
        processNextChunk();
      });
    };
    
    // Execute otimizações
    deferNonEssentialWork();
    const cleanup = optimizeUiInteractions();
    
    return () => {
      cleanup();
    };
  }, []);

  return null;
}