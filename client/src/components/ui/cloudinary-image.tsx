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

  // Enhanced error handling - try alternate sources if available
  const handleError = () => {
    setIsLoading(false);
    
    // If we were using Cloudinary and it failed, try the original source as a fallback
    if (useCloudinary && src) {
      console.log("Cloudinary image failed to load, attempting fallback to original source:", src);
      // We intentionally don't set hasError yet - we'll try the fallback first
      
      // Create a new image element to test if the original source loads
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        // If the fallback loads, switch to it
        console.log("Fallback image loaded successfully");
        setIsLoading(false);
        // Force a re-render with the original source
        setHasError(false);
      };
      
      fallbackImg.onerror = () => {
        // If even the fallback fails, show error state
        console.log("Fallback image also failed to load");
        setHasError(true);
        onError?.();
      };
      
      // Try the original source as fallback
      fallbackImg.src = src.startsWith('/proxy-image') ? src : 
        (src.startsWith('http') ? `/proxy-image?url=${encodeURIComponent(src)}` : `/proxy-image${src}`);
    } else {
      // If we weren't using Cloudinary or don't have an alternate source, just show error
      setHasError(true);
      onError?.();
    }
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden inline-block",
        className
      )}
      style={{ 
        width: 'fit-content',
        margin: '0 auto'
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
        onClick={(e) => e.preventDefault()}
        style={{ pointerEvents: "none" }}
        className={cn(
          "w-full h-full object-contain transition-opacity duration-300 rounded-lg border border-gray-200",
          isLoading ? "opacity-0" : "opacity-100",
          hasError ? "hidden" : "block"
        )}
      />
      
      {/* Improved error fallback with better styling */}
      {hasError && (
        <div className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-2" 
             style={{ width: width || 'auto', height: height || 100, minWidth: 80, minHeight: 60 }}>
          <div className="flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                 className="text-gray-400 mb-1">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span className="text-xs text-gray-500 text-center line-clamp-2">{alt || 'Image'}</span>
          </div>
        </div>
      )}
    </div>
  );
}