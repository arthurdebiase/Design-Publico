/**
 * Utility functions for handling images in the application
 */

/**
 * Tamanhos padrão para dimensionamento responsivo de imagens
 * Esses tamanhos são otimizados para diferentes breakpoints
 */
export const RESPONSIVE_IMAGE_SIZES = {
  small: [320, 480, 640],
  medium: [640, 768, 1024],
  large: [1024, 1280, 1536, 1920],
  thumbnail: [80, 160, 240],
};

/**
 * Options for image processing
 */
export interface ImageProcessingOptions {
  /** Width of the image in pixels */
  width?: number;
  /** Height of the image in pixels */
  height?: number;
  /** Output format (webp, avif, jpeg, png, or original) */
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'original';
  /** Quality of the image compression (1-100) */
  quality?: number;
  /** Whether this is a priority image for LCP */
  priority?: boolean;
}

/**
 * Process an image URL to ensure it will load properly
 * This handles Airtable CDN URLs by routing them through our proxy with optimization
 * 
 * @param url The original image URL
 * @param options Optional image processing options
 * @returns A processed URL that should load reliably
 */
export function getProcessedImageUrl(
  url: string | null | undefined, 
  options?: ImageProcessingOptions
): string {
  if (!url) return '';
  
  // For Cloudinary URLs, we'll optimize them directly using Cloudinary's URL parameters
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    try {
      // Extract the base URL and image path
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        const baseUrl = parts[0] + '/upload/';
        const imagePath = parts[1];
        
        // Build transformation parameters
        const transformParams: string[] = [];
        
        if (options) {
          // Add crop and gravity for better control
          transformParams.push('c_limit');
          
          // Add width and height if provided
          if (options.width) transformParams.push(`w_${options.width}`);
          if (options.height) transformParams.push(`h_${options.height}`);
          
          // Add format and quality if provided
          if (options.format && options.format !== 'original') transformParams.push(`f_${options.format}`);
          if (options.quality) transformParams.push(`q_${options.quality}`);
        }
        
        // If we have transformations, add them to the URL
        if (transformParams.length > 0) {
          return `${baseUrl}${transformParams.join(',')}/${imagePath}`;
        }
      }
    } catch (error) {
      console.error("Error processing Cloudinary URL:", error);
    }
    
    // If any errors or no transformations, return the original Cloudinary URL
    return url;
  }
  
  // For Airtable CDN URLs, use our proxy route
  if (url.includes('airtableusercontent.com') || url.startsWith('/v3/')) {
    try {
      // If it's already a proxy URL that starts with /proxy-image, just use it
      if (url.startsWith('/proxy-image')) {
        return url;
      }
      
      // For URLs that directly start with /v3/, they're already paths
      const path = url.startsWith('/v3/') ? url : (new URL(url)).pathname;
      
      // Base proxy URL
      let proxyUrl = `/proxy-image${path}`;
      
      // Add query parameters for optimization if provided
      const params: string[] = [];
      
      if (options) {
        if (options.width) params.push(`width=${options.width}`);
        if (options.height) params.push(`height=${options.height}`);
        if (options.format) params.push(`format=${options.format}`);
        if (options.quality) params.push(`quality=${options.quality}`);
        if (options.priority) params.push(`priority=true`);
      }
      
      // Add timestamp to prevent caching of broken images
      params.push(`_ts=${Date.now()}`);
      
      if (params.length > 0) {
        proxyUrl += `?${params.join('&')}`;
      }
      
      return proxyUrl;
    } catch (error) {
      console.error("Error processing Airtable URL:", error);
      // If there's an error parsing, try to extract the path manually
      try {
        // Remove the protocol and domain part to get just the path
        const fullUrl = url;
        const pathStart = fullUrl.indexOf('airtableusercontent.com') + 'airtableusercontent.com'.length;
        const path = fullUrl.substring(pathStart);
        
        return `/proxy-image${path}?_ts=${Date.now()}`;
      } catch (fallbackError) {
        console.error("Fallback extraction failed:", fallbackError);
        // Last resort - return the original URL
        return url;
      }
    }
  }
  
  return url;
}

/**
 * Check if an image is from Airtable
 * 
 * @param url The image URL to check
 * @returns Boolean indicating if the image is hosted on Airtable
 */
export function isAirtableImage(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('airtableusercontent.com');
}

/**
 * Create a fallback image with the first letter of a name
 * 
 * @param name The name to use for the fallback
 * @param backgroundColor Optional background color hex code
 * @returns A data URL containing an SVG image 
 */
export function createFallbackImage(name: string, backgroundColor = '#f3f4f6'): string {
  const letter = name.charAt(0).toUpperCase();
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${backgroundColor}" />
      <text x="50" y="50" font-family="Arial" font-size="40" font-weight="bold" fill="#333" text-anchor="middle" dominant-baseline="central">
        ${letter}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}