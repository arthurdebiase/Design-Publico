import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface CloudinaryImageProps {
  src: string;
  cloudinarySrc?: string | null; // From the "cloudinaryUrl" field in our schema
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * CloudinaryImage component that prefers Cloudinary URLs when available
 * Falls back to our proxy system for Airtable URLs when no Cloudinary URL is available
 */
export function CloudinaryImage({
  src,
  cloudinarySrc,
  alt,
  width,
  height,
  className,
  priority = false,
  onLoad,
  onError
}: CloudinaryImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Determine the image source to use - prefer Cloudinary when available
  const useCloudinary = cloudinarySrc && cloudinarySrc.length > 0;
  const imageSource = useCloudinary ? cloudinarySrc : 
    (src.startsWith('/proxy-image') ? src : 
     (src.startsWith('http') ? `/proxy-image?url=${encodeURIComponent(src)}` : `/proxy-image${src}`));

  // For debugging - will be removed in production
  console.debug("CloudinaryImage source selection:", {
    useCloudinary,
    cloudinarySrc,
    originalSrc: src,
    finalSrc: imageSource
  });

  // Create URL parameter string for proxy requests (not needed for Cloudinary URLs)
  const imageParams = !useCloudinary && src ? 
    `${imageSource}${imageSource.includes('?') ? '&' : '?'}` +
    `${width ? `width=${width}` : ''}` +
    `${height ? `&height=${height}` : ''}` +
    `&format=auto` +
    `${priority ? '&priority=true' : ''}` 
    : imageSource;

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden",
        className
      )}
      style={{ 
        aspectRatio: width && height ? `${width}/${height}` : undefined
      }}
    >
      {/* Skeleton loader shown while image is loading */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Actual image */}
      <img
        src={imageParams}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-contain transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          hasError ? "hidden" : "block"
        )}
      />
      
      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 border">
          <span className="text-sm text-gray-500">{alt || 'Image'}</span>
        </div>
      )}
    </div>
  );
}