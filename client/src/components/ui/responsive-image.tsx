import React, { useState } from 'react';
import { getProcessedImageUrl, ImageProcessingOptions } from '@/lib/imageUtils';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * The source URL of the image
   */
  src: string;
  
  /**
   * Optional Cloudinary URL that will be preferred over the src if available
   * This helps with reliable image hosting when Airtable URLs might expire
   */
  cloudinarySrc?: string | null;
  
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
 * for responsive images with WebP/AVIF support.
 * Will prioritize Cloudinary URLs when available for better reliability.
 */
export function ResponsiveImage({
  src,
  cloudinarySrc,
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
  
  // Determine if we should use Cloudinary URL (reliable) or Airtable URL (via proxy)
  // Always prefer Cloudinary URLs when available as they're more reliable
  const useCloudinary = !!cloudinarySrc && cloudinarySrc.trim().length > 0;
  const actualSrc = useCloudinary ? cloudinarySrc.trim() : src;
  
  // Generate srcset based on provided widths
  const generateSrcSet = () => {
    // Use the getProcessedImageUrl function which now handles both Cloudinary and Airtable URLs
    return widths
      .map(width => {
        const options: ImageProcessingOptions = {
          width,
          format,
          quality
        };
        
        // Use the cloudinarySrc if it exists, otherwise use the regular src
        const sourceUrl = useCloudinary ? cloudinarySrc : actualSrc;
        const url = getProcessedImageUrl(sourceUrl, options);
        return `${url} ${width}w`;
      })
      .join(', ');
  };
  
  // Generate a src with default parameters
  const defaultSrc = getProcessedImageUrl(
    useCloudinary ? cloudinarySrc : actualSrc, 
    {
      width: widths[0],
      format,
      quality
    }
  );
  
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
        style={{ ...style, aspectRatio: style?.aspectRatio || '1/1' }}
        aria-hidden="true"
      />
    );
  };
  
  // Show error state
  const renderError = () => (
    <div 
      className={`bg-gray-200 flex items-center justify-center text-gray-400 ${placeholderClassName}`}
      style={{ ...style, aspectRatio: style?.aspectRatio || '1/1' }}
      aria-hidden="true"
    >
      <span>Image not available</span>
    </div>
  );
  
  if (hasError) return <div className="relative" style={{ width: '100%', height: '100%' }}>{renderError()}</div>;
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: '100%', height: '100%' }}>
      {!isLoaded && <div className="absolute inset-0">{renderPlaceholder()}</div>}
      <img
        src={defaultSrc}
        srcSet={generateSrcSet()}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        {...(priority ? { fetchpriority: 'high' } : {})}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} w-full h-full`}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          ...style,
          transition: 'opacity 0.3s ease',
        }}
        {...props}
      />
    </div>
  );
}