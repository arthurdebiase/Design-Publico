import { useState, useEffect, useRef } from 'react';
import { getProcessedImageUrl } from './imageUtils';

interface LazyImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  placeholder?: React.ReactNode;
  errorPlaceholder?: React.ReactNode;
  showLoader?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export default function LazyImage({
  src,
  alt,
  className = '',
  width,
  height,
  quality = 80,
  placeholder,
  errorPlaceholder,
  showLoader = true,
  onLoad,
  onError,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imageRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Process image URL once on mount or when src changes
  useEffect(() => {
    // Reset states when source changes
    setLoaded(false);
    setError(false);
    
    if (src) {
      const processed = getProcessedImageUrl(src);
      
      // Improve performance by adding quality parameter if it doesn't have one
      // Only for proxied Airtable images
      if (processed.startsWith('/v5.airtableusercontent.com') && quality && quality < 100) {
        // Add quality optimization parameter
        setImageSrc(`${processed}?quality=${quality}`);
      } else {
        setImageSrc(processed);
      }
    } else {
      setImageSrc('');
      setError(true);
    }
  }, [src, quality]);
  
  // Set up intersection observer for lazy loading
  useEffect(() => {
    // Initialize the IntersectionObserver
    const options = {
      root: null, // using viewport as root
      rootMargin: '200px', // load when within 200px of viewport
      threshold: 0.01 // trigger when 1% visible
    };
    
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && imageRef.current && !loaded && !error) {
          // Start loading the image when it's in view
          const imgElement = imageRef.current;
          imgElement.src = imageSrc;
          
          // Disconnect after loading starts
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      });
    };
    
    if (imageRef.current && imageSrc && !loaded && !error) {
      observerRef.current = new IntersectionObserver(handleIntersect, options);
      observerRef.current.observe(imageRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [imageSrc, loaded, error]);
  
  const handleLoad = () => {
    setLoaded(true);
    if (onLoad) onLoad();
  };
  
  const handleError = () => {
    // If already using proxy and still failed, mark as error
    if (imageSrc.startsWith('/v5.airtableusercontent.com')) {
      setError(true);
      if (onError) onError();
      return;
    }
    
    // Try with proxy if direct URL failed for Airtable images
    if (imageSrc.startsWith('https://v5.airtableusercontent.com')) {
      const proxyUrl = imageSrc.replace('https://v5.airtableusercontent.com', '/v5.airtableusercontent.com');
      setImageSrc(`${proxyUrl}?quality=${quality}`);
    } else {
      setError(true);
      if (onError) onError();
    }
  };
  
  return (
    <div className="relative" style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '100%' }}>
      {/* Loading state */}
      {!loaded && !error && showLoader && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
          {placeholder || <span className="sr-only">Loading...</span>}
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          {errorPlaceholder || <span className="text-gray-400">Image not available</span>}
        </div>
      )}
      
      {/* Image with reference for intersection observer */}
      <img 
        ref={imageRef}
        src="" // Will be set by intersection observer
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        width={width}
        height={height}
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
}