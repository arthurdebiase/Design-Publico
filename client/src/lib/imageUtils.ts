/**
 * Utility functions for handling images in the application
 */

/**
 * Process an image URL to ensure it will load properly
 * This handles Airtable CDN URLs by routing them through our proxy if needed
 * 
 * @param url The original image URL
 * @returns A processed URL that should load reliably
 */
export function getProcessedImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // For Airtable CDN URLs, use our proxy route
  if (url.startsWith('https://v5.airtableusercontent.com')) {
    return url.replace('https://v5.airtableusercontent.com', '/v5.airtableusercontent.com');
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