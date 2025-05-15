import React from 'react';
import { getProcessedImageUrl, RESPONSIVE_IMAGE_SIZES } from '@/lib/imageUtils';

/**
 * Componente para otimizar o carregamento e dimensionamento de imagens
 * Implementa carregamento progressivo e dimensões apropriadas para diferentes dispositivos
 */
export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className, 
  priority = false,
  containerClassName,
  sizes = '100vw',
  objectFit = 'cover'
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  containerClassName?: string;
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}) {
  // Gerar URLs otimizadas para diferentes tamanhos de tela
  const generateSrcSet = () => {
    const allSizes = [...RESPONSIVE_IMAGE_SIZES.small, ...RESPONSIVE_IMAGE_SIZES.medium, ...RESPONSIVE_IMAGE_SIZES.large];
    
    return allSizes
      .filter((size, index, self) => self.indexOf(size) === index) // Remover duplicatas
      .sort((a, b) => a - b) // Ordenar do menor para o maior
      .map(size => {
        const url = getProcessedImageUrl(src, {
          width: size,
          format: 'auto', // Deixar o servidor decidir o melhor formato
          quality: size < 640 ? 80 : 85, // Qualidade ligeiramente maior para imagens maiores
          priority
        });
        return `${url} ${size}w`;
      })
      .join(', ');
  };

  // Processar URL base com tamanho padrão
  const optimizedSrc = getProcessedImageUrl(src, {
    width: width || 800, // Tamanho padrão razoável
    format: 'auto',
    quality: 85,
    priority
  });

  // URL de baixa qualidade para carregamento imediato
  const placeholderSrc = getProcessedImageUrl(src, {
    width: 40, // Muito pequena
    quality: 20, // Baixa qualidade
    format: 'webp'
  });

  return (
    <div 
      className={`${containerClassName || ''} ${priority ? 'high-priority-image' : ''}`}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Imagem de placeholder de baixa qualidade */}
      <img 
        src={placeholderSrc}
        alt=""
        aria-hidden="true"
        className={`${className || ''} blur-sm absolute inset-0 w-full h-full transition-opacity duration-300`}
        style={{ 
          objectFit,
          filter: 'blur(20px)',
          transform: 'scale(1.1)', // Ligeiramente maior para cobrir bordas durante o blur
          opacity: 0.7
        }}
      />
      
      {/* Imagem principal otimizada */}
      <img 
        src={optimizedSrc}
        srcSet={generateSrcSet()}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        className={`${className || ''} transition-opacity duration-500 relative z-10`}
        style={{ objectFit }}
        onLoad={(e) => {
          // Remover blur quando a imagem principal carrega
          const target = e.target as HTMLImageElement;
          const parent = target.parentElement;
          if (parent) {
            const placeholder = parent.querySelector('img[aria-hidden="true"]');
            if (placeholder) {
              placeholder.classList.add('opacity-0');
            }
          }
        }}
      />
    </div>
  );
}