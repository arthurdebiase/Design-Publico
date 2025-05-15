import React, { useState, useEffect } from 'react';
import { getProcessedImageUrl } from '@/lib/imageUtils';

/**
 * Componente para otimizar o carregamento e dimensionamento de imagens
 * Implementa carregamento progressivo e dimensões apropriadas para diferentes dispositivos
 */
export function OptimizedImage({ 
  src, 
  alt,
  width, 
  height,
  className = '',
  priority = false,
  quality = 85
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  quality?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(priority);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  // Calcular a melhor largura para a tela
  useEffect(() => {
    // Definir tamanhos de imagem comuns para diferentes dispositivos
    const breakpoints = [320, 640, 768, 1024, 1280, 1536];
    
    // Encontrar a melhor largura para o dispositivo atual
    const findOptimalWidth = () => {
      const screenWidth = window.innerWidth;
      // Encontrar o próximo breakpoint maior que a largura da tela atual
      const optimalWidth = breakpoints.find(bp => bp >= screenWidth) || breakpoints[breakpoints.length - 1];
      return Math.min(optimalWidth, width * 2); // 2x para telas de alta densidade
    };

    const optimalWidth = findOptimalWidth();
    
    // Gerar URL otimizada com dimensões apropriadas
    const optimizedUrl = getProcessedImageUrl(src, {
      width: optimalWidth,
      format: 'webp',
      quality: quality
    });
    
    setImgSrc(optimizedUrl);
    
    // Atualizar se a janela for redimensionada
    const handleResize = () => {
      const newOptimalWidth = findOptimalWidth();
      const newUrl = getProcessedImageUrl(src, {
        width: newOptimalWidth,
        format: 'webp',
        quality: quality
      });
      setImgSrc(newUrl);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [src, width, quality]);

  // Usar Intersection Observer para carregamento lazy quando não for prioritário
  useEffect(() => {
    if (priority) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '200px' // Pré-carregar imagens quando estiverem a 200px de distância da viewport
      }
    );

    const element = document.getElementById(`img-${src.replace(/[^\w]/g, '-')}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [src, priority]);

  // Placeholder enquanto a imagem estiver carregando
  const placeholderStyle = {
    backgroundColor: '#f3f4f6',
    width: '100%',
    height: '100%',
    aspectRatio: `${width} / ${height}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.3s ease',
    opacity: loaded ? 0 : 1,
    position: 'absolute' as const,
    top: 0,
    left: 0,
  };

  return (
    <div 
      className={`relative ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
      id={`img-${src.replace(/[^\w]/g, '-')}`}
    >
      {/* Placeholder */}
      <div style={placeholderStyle}>
        <span className="text-gray-400 text-sm">Carregando...</span>
      </div>
      
      {/* Imagem real */}
      {(priority || isIntersecting) && imgSrc && (
        <img
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transition: 'opacity 0.3s ease',
            opacity: loaded ? 1 : 0,
          }}
        />
      )}
    </div>
  );
}