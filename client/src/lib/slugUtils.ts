/**
 * Converte uma string para um slug URL amigável
 * - Remove acentos
 * - Converte para minúsculas
 * - Substitui espaços por hífens
 * - Remove caracteres especiais
 * 
 * @param text Texto para converter em slug
 * @returns URL slug formatado
 */
export function createSlug(text: string): string {
  if (!text) return '';
  
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/[\s_]+/g, '-') // Substitui espaços e underscores por hífens
    .replace(/^-+|-+$/g, ''); // Remove hífens extras do início e fim
}

/**
 * Extrai e converte o ID numérico ou slug do app da URL
 * 
 * @param idOrSlug ID ou slug do aplicativo
 * @returns O ID numérico (se for um número) ou o slug original
 */
export function parseAppIdOrSlug(idOrSlug: string): number | string {
  const numericId = parseInt(idOrSlug, 10);
  return isNaN(numericId) ? idOrSlug : numericId;
}