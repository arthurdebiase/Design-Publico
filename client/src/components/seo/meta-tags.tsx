import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  keywords?: string[];
}

/**
 * MetaTags component dynamically updates the document metadata based on the current route
 * This helps with SEO by providing page-specific meta information
 */
export default function MetaTags({
  title,
  description,
  image,
  type = 'website',
  keywords = [],
}: MetaTagsProps) {
  const [location] = useLocation();
  const baseTitle = 'DESIGN PÚBLICO';
  const baseUrl = window.location.origin;
  const currentUrl = baseUrl + location;
  
  const finalTitle = title 
    ? `${title} | ${baseTitle}` 
    : `${baseTitle} - Referências de Interfaces Públicas Digitais`;
  
  const finalDescription = description || 'Uma base de referências visuais de interfaces públicas digitais. Reunimos bons exemplos de design para inspirar quem cria serviços digitais para a população.';
  
  const finalImage = image 
    ? (image.startsWith('http') ? image : `${baseUrl}${image}`) 
    : `${baseUrl}/designpublico-social.png`;
    
  const finalKeywords = [
    'design público',
    'interface pública',
    'design de serviços',
    'governo digital',
    'ux design',
    'design de aplicativos',
    'design de interfaces',
    'design inclusivo',
    ...keywords
  ].join(', ');

  useEffect(() => {
    // Update all meta tags
    document.title = finalTitle;
    
    // Basic meta tags
    updateMetaTag('description', finalDescription);
    updateMetaTag('keywords', finalKeywords);
    
    // Open Graph / Facebook
    updateMetaTag('og:title', finalTitle, 'property');
    updateMetaTag('og:description', finalDescription, 'property');
    updateMetaTag('og:image', finalImage, 'property');
    updateMetaTag('og:url', currentUrl, 'property');
    updateMetaTag('og:type', type, 'property');
    
    // Twitter
    updateMetaTag('twitter:title', finalTitle, 'property');
    updateMetaTag('twitter:description', finalDescription, 'property');
    updateMetaTag('twitter:image', finalImage, 'property');
    updateMetaTag('twitter:url', currentUrl, 'property');
    updateMetaTag('twitter:card', 'summary_large_image', 'property');
    
    // Update canonical link
    let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalElement) {
      canonicalElement.href = currentUrl;
    } else {
      canonicalElement = document.createElement('link');
      canonicalElement.rel = 'canonical';
      canonicalElement.href = currentUrl;
      document.head.appendChild(canonicalElement);
    }
  }, [finalTitle, finalDescription, finalImage, currentUrl, finalKeywords, type]);

  return null; // This component doesn't render anything
}

/**
 * Helper function to update or create a meta tag
 */
function updateMetaTag(name: string, content: string, attributeName: 'name' | 'property' = 'name') {
  let meta = document.querySelector(`meta[${attributeName}="${name}"]`) as HTMLMetaElement;
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attributeName, name);
    document.head.appendChild(meta);
  }
  
  meta.content = content;
}