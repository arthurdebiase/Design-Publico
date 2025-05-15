/**
 * Utility functions for handling images in the application
 */

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
  
  // For Airtable CDN URLs, use our proxy route
  if (url.includes('airtableusercontent.com')) {
    // Extract the path after the domain
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Base proxy URL
    let proxyUrl = `/proxy-image${path}`;
    
    // Add query parameters for optimization if provided
    if (options) {
      const params: string[] = [];
      
      if (options.width) params.push(`width=${options.width}`);
      if (options.height) params.push(`height=${options.height}`);
      if (options.format) params.push(`format=${options.format}`);
      if (options.quality) params.push(`quality=${options.quality}`);
      
      if (params.length > 0) {
        proxyUrl += `?${params.join('&')}`;
      }
    }
    
    return proxyUrl;
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