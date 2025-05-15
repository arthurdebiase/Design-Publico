import React, { useEffect, useState, useRef } from 'react';

interface OptimizedImageLoaderProps {
  /**
   * Lista de URLs de imagens para pré-carregar
   * Observe que apenas devemos pré-carregar imagens críticas visíveis inicialmente
   */
  imageSrcs: string[];
  
  /**
   * Especifica se deve modificar a prioridade de carregamento com fetchPriority
   * Deve ser 'high' para imagens LCP (Largest Contentful Paint)
   */
  priority?: 'high' | 'low' | 'auto';
  
  /**
   * Callback executado quando todas as imagens são carregadas
   */
  onAllLoaded?: () => void;
  
  /**
   * Limita o número máximo de imagens carregadas simultaneamente
   * para não sobrecarregar o navegador
   */
  concurrentLoads?: number;
}

/**
 * OptimizedImageLoader
 * 
 * Gerencia o carregamento otimizado de imagens críticas para melhorar o LCP
 * utilizando técnicas como:
 * - Priorização com fetchPriority para imagens importantes
 * - Carregamento concorrente limitado para reduzir o uso de CPU
 * - Pré-carregamento de imagens acima da dobra (viewport)
 */
export const OptimizedImageLoader: React.FC<OptimizedImageLoaderProps> = ({
  imageSrcs,
  priority = 'auto',
  onAllLoaded,
  concurrentLoads = 4
}) => {
  const [loadedCount, setLoadedCount] = useState(0);
  const queueRef = useRef<string[]>([]);
  const activeLoadsRef = useRef(0);
  const loadedImagesRef = useRef(new Set<string>());
  
  // Processar a fila de carregamento de imagens com limite de concorrência
  const processQueue = () => {
    // Se não há mais imagens para carregar ou já atingimos o limite, sair
    if (queueRef.current.length === 0 || activeLoadsRef.current >= concurrentLoads) {
      return;
    }
    
    // Obter próxima imagem da fila
    const nextSrc = queueRef.current.shift();
    if (!nextSrc) return;
    
    // Incrementar contador de carregamentos ativos
    activeLoadsRef.current++;
    
    // Criar nova imagem e configurar handlers
    const img = new Image();
    
    // Definir fetchpriority se suportado pelo navegador (usando lowercase conforme o padrão do DOM)
    if ('fetchPriority' in HTMLImageElement.prototype) {
      (img as any).fetchpriority = priority;
    }
    
    img.onload = img.onerror = () => {
      // Decrementar contador de carregamentos ativos
      activeLoadsRef.current--;
      
      // Marcar imagem como carregada
      loadedImagesRef.current.add(nextSrc);
      setLoadedCount(prev => prev + 1);
      
      // Processar próxima imagem na fila
      processQueue();
      
      // Se todas as imagens foram carregadas, chamar callback
      if (loadedImagesRef.current.size === imageSrcs.length) {
        onAllLoaded?.();
      }
    };
    
    // Iniciar carregamento
    img.src = nextSrc;
  };
  
  useEffect(() => {
    // Resetar o estado quando a lista de imagens muda
    queueRef.current = [...imageSrcs];
    loadedImagesRef.current.clear();
    setLoadedCount(0);
    activeLoadsRef.current = 0;
    
    // Iniciar processamento da fila com limite de concorrência
    for (let i = 0; i < Math.min(concurrentLoads, imageSrcs.length); i++) {
      processQueue();
    }
    
    // Se não houver imagens para carregar, chamar callback imediatamente
    if (imageSrcs.length === 0) {
      onAllLoaded?.();
    }
  }, [imageSrcs, concurrentLoads, onAllLoaded]);
  
  // Este componente não renderiza nada visualmente
  return null;
};

export default OptimizedImageLoader;