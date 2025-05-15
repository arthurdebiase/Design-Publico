import React, { useEffect, useRef } from 'react';

interface ScriptOptimizerProps {
  /**
   * Scripts a serem otimizados, com diferentes níveis de prioridade
   */
  scripts?: {
    // Scripts críticos que devem ser carregados imediatamente
    critical?: Array<{
      src?: string;
      content?: string;
      id?: string;
      async?: boolean;
      defer?: boolean;
      strategy?: 'inline' | 'external';
    }>;
    
    // Scripts importantes mas não críticos (carregamento com prioridade média)
    important?: Array<{
      src?: string;
      content?: string;
      id?: string;
      async?: boolean;
      defer?: boolean;
    }>;
    
    // Scripts não críticos que podem ser carregados no final
    lowPriority?: Array<{
      src?: string;
      content?: string;
      id?: string;
    }>;
  };
}

/**
 * ScriptOptimizer
 * 
 * Componente para gerenciar o carregamento otimizado de scripts no site,
 * usando técnicas como:
 * - Scripts críticos carregados com prioridade alta
 * - Scripts não críticos carregados após o load event
 * - Inline de código crítico para evitar requests adicionais
 * 
 * Isso melhora o TBT (Total Blocking Time) e FID (First Input Delay)
 */
export const ScriptOptimizer: React.FC<ScriptOptimizerProps> = ({
  scripts = {
    critical: [],
    important: [],
    lowPriority: []
  }
}) => {
  const loadedScripts = useRef(new Set<string>());
  
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const head = document.head || document.getElementsByTagName('head')[0];
    const loadedScriptsList = loadedScripts.current;
    
    // Monitorar scripts já inseridos para evitar duplicação
    const scriptElements: HTMLScriptElement[] = [];
    
    // 1. Carregar scripts críticos imediatamente
    if (scripts.critical && scripts.critical.length > 0) {
      scripts.critical.forEach(scriptData => {
        if (scriptData.src && loadedScriptsList.has(scriptData.src)) return;
        
        if (scriptData.src) loadedScriptsList.add(scriptData.src);
        
        const script = document.createElement('script');
        
        if (scriptData.id) {
          script.id = scriptData.id;
        }
        
        if (scriptData.strategy === 'inline' && scriptData.content) {
          // Script inline - melhor para código crítico pequeno
          script.textContent = scriptData.content;
        } else if (scriptData.src) {
          // Script externo
          script.src = scriptData.src;
          script.async = scriptData.async ?? true;
          script.defer = scriptData.defer ?? false;
        }
        
        head.appendChild(script);
        scriptElements.push(script);
      });
    }
    
    // 2. Carregar scripts importantes depois de DOMContentLoaded
    const loadImportantScripts = () => {
      if (scripts.important && scripts.important.length > 0) {
        scripts.important.forEach(scriptData => {
          if (scriptData.src && loadedScriptsList.has(scriptData.src)) return;
          
          if (scriptData.src) loadedScriptsList.add(scriptData.src);
          
          const script = document.createElement('script');
          
          if (scriptData.id) {
            script.id = scriptData.id;
          }
          
          if (scriptData.src) {
            script.src = scriptData.src;
            script.async = scriptData.async ?? true;
            script.defer = scriptData.defer ?? true;
          } else if (scriptData.content) {
            script.textContent = scriptData.content;
          }
          
          head.appendChild(script);
          scriptElements.push(script);
        });
      }
    };
    
    // 3. Carregar scripts de baixa prioridade após o window.load
    const loadLowPriorityScripts = () => {
      if (scripts.lowPriority && scripts.lowPriority.length > 0) {
        // Usar requestIdleCallback se disponível, ou setTimeout como fallback
        const scheduleLoad = window.requestIdleCallback || 
          ((cb) => setTimeout(cb, 1000)); // Fallback com 1 segundo de atraso
        
        scheduleLoad(() => {
          scripts.lowPriority?.forEach(scriptData => {
            if (scriptData.src && loadedScriptsList.has(scriptData.src)) return;
            
            if (scriptData.src) loadedScriptsList.add(scriptData.src);
            
            const script = document.createElement('script');
            
            if (scriptData.id) {
              script.id = scriptData.id;
            }
            
            if (scriptData.src) {
              script.src = scriptData.src;
              script.async = true;
              script.defer = true;
            } else if (scriptData.content) {
              script.textContent = scriptData.content;
            }
            
            document.body.appendChild(script);
            scriptElements.push(script);
          });
        });
      }
    };
    
    // Adicionar event listeners para as diferentes fases de carregamento
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadImportantScripts);
      window.addEventListener('load', loadLowPriorityScripts);
    } else {
      // Documento já carregou, executar imediatamente mas em ordem
      loadImportantScripts();
      
      if (document.readyState === 'complete') {
        loadLowPriorityScripts();
      } else {
        window.addEventListener('load', loadLowPriorityScripts);
      }
    }
    
    // Limpeza na desmontagem
    return () => {
      document.removeEventListener('DOMContentLoaded', loadImportantScripts);
      window.removeEventListener('load', loadLowPriorityScripts);
      
      // Remover scripts criados dinamicamente
      scriptElements.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [scripts]);
  
  return null; // Componente não renderiza nada visualmente
};

export default ScriptOptimizer;