import React, { useState } from 'react';
import { getProcessedImageUrl, ImageProcessingOptions } from '@/lib/imageUtils';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * The source URL of the image
   */
  src: string;
  
  /**
   * The alt text for accessibility
   */
  alt: string;
  
  /**
   * Optional sizes for different viewport widths
   * Format: (min-width: 1200px) 33vw, 100vw
   */
  sizes?: string;
  
  /**
   * Optional array of widths for srcset generation
   */
  widths?: number[];
  
  /**
   * Optional image format
   */
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'original';
  
  /**
   * Optional image quality (1-100)
   */
  quality?: number;
  
  /**
   * Optional class for placeholder
   */
  placeholderClassName?: string;
  
  /**
   * Optional placeholder component
   */
  placeholder?: React.ReactNode;
  
  /**
   * Whether this image is a priority image that should load eagerly (for LCP)
   */
  priority?: boolean;
}

const DEFAULT_WIDTHS = [640, 960, 1280];

/**
 * ResponsiveImage component that generates srcset and sizes attributes
 * for responsive images with WebP/AVIF support
 */
export function ResponsiveImage({
  src,
  alt,
  sizes = '100vw',
  widths = DEFAULT_WIDTHS,
  format = 'webp',
  quality = 80,
  className = '',
  placeholderClassName = '',
  placeholder,
  priority = false,
  onLoad,
  onError,
  style,
  ...props
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Generate srcset based on provided widths
  const generateSrcSet = () => {
    return widths
      .map(width => {
        const options: ImageProcessingOptions = {
          width,
          format,
          quality
        };
        
        const url = getProcessedImageUrl(src, options);
        return `${url} ${width}w`;
      })
      .join(', ');
  };
  
  // Generate a src with default parameters
  const defaultSrc = getProcessedImageUrl(src, {
    width: widths[0],
    format,
    quality
  });
  
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };
  
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    if (onError) onError(e);
  };
  
  // Show custom placeholder or default placeholder when loading
  const renderPlaceholder = () => {
    if (placeholder) return placeholder;
    
    return (
      <div 
        className={`bg-gray-200 animate-pulse ${placeholderClassName}`}
        style={style}
        aria-hidden="true"
      />
    );
  };
  
  // Show error state
  const renderError = () => (
    <div 
      className={`bg-gray-200 flex items-center justify-center text-gray-400 ${placeholderClassName}`}
      style={style}
      aria-hidden="true"
    >
      <span>Image not available</span>
    </div>
  );
  
  if (hasError) return renderError();
  
  return (
    <>
      {!isLoaded && renderPlaceholder()}
      <img
        src={defaultSrc}
        srcSet={generateSrcSet()}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        {...(priority ? { 'fetchpriority': 'high' } : {})}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          ...style,
          transition: 'opacity 0.3s ease',
        }}
        {...props}
      />
    </>
  );
}