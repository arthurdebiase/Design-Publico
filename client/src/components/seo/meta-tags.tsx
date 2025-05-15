import React from 'react';
import { Helmet } from 'react-helmet-async';

interface MetaTagsProps {
  /**
   * Title da página - será combinado com o sufixo do site
   */
  title?: string;
  
  /**
   * Descrição da página para SEO
   */
  description?: string;
  
  /**
   * URL da imagem para compartilhamento em redes sociais
   */
  image?: string;
  
  /**
   * URL canônica da página
   */
  canonical?: string;
  
  /**
   * Lista de palavras-chave para SEO
   */
  keywords?: string[];
  
  /**
   * Tipo de conteúdo para Open Graph (og:type)
   */
  type?: 'website' | 'article' | 'profile' | 'book' | 'video';
}

/**
 * MetaTags Component
 * 
 * Componente para gerenciar meta tags e SEO das páginas,
 * com suporte para Open Graph, Twitter Cards, e schema.org
 */
export const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  description = 'DESIGN PÚBLICO é uma base de referências visuais de interfaces públicas digitais. Reunimos bons exemplos de design para inspirar quem cria serviços digitais para a população.',
  image = '/images/designpublico-share.jpg',
  canonical,
  keywords = ['design público', 'interfaces públicas', 'design gov', 'design de serviços', 'UX governo', 'UI governo'],
  type = 'website'
}) => {
  // Nome do site para combinação com títulos de página
  const siteName = 'DESIGN PÚBLICO';
  
  // Título formatado, com limite para evitar cortes
  const finalTitle = title 
    ? `${title} | ${siteName}` 
    : `${siteName} - Base de referências visuais de interfaces públicas`;
  
  // Assegurar que a descrição não seja muito longa (recomendado: ~155-160 caracteres)
  const finalDescription = description && description.length > 160 
    ? `${description.substring(0, 157)}...` 
    : description;
  
  // Garantir que imagem seja uma URL absoluta
  const absoluteImageUrl = image && !image.startsWith('http') 
    ? `https://designpublico.com.br${image}` 
    : image;
  
  // URL canônica completa
  const absoluteCanonical = canonical 
    ? `https://designpublico.com.br${canonical}` 
    : 'https://designpublico.com.br';
  
  return (
    <Helmet>
      {/* Título e metadados básicos */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      
      {/* Link canônico - importante para SEO e evitar conteúdo duplicado */}
      <link rel="canonical" href={absoluteCanonical} />
      
      {/* Metadados para SEO avançado */}
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content="Design Público" />
      <meta name="robots" content="index, follow" />
      
      {/* Controle de viewport (já configurado para acessibilidade) */}
      <meta 
        name="viewport" 
        content="width=device-width, initial-scale=1.0" 
      />
      
      {/* Open Graph meta tags para compartilhamento em redes sociais */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:url" content={absoluteCanonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Twitter Card meta tags para compartilhamento no Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={absoluteImageUrl} />
      
      {/* Dados estruturados com schema.org para Rich Snippets */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          'name': siteName,
          'url': 'https://designpublico.com.br',
          'description': description,
          'potentialAction': {
            '@type': 'SearchAction',
            'target': 'https://designpublico.com.br/screens?search={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        })}
      </script>
    </Helmet>
  );
};

export default MetaTags;