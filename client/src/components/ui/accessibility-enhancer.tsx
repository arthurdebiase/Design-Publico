import React, { useEffect } from 'react';

/**
 * AccessibilityEnhancer - Componente para melhorar a acessibilidade geral da aplicação
 * 
 * Este componente adiciona atributos de acessibilidade a elementos que precisam deles
 * como botões sem texto, imagens sem alt, e melhora a navegabilidade por teclado
 */
export function AccessibilityEnhancer() {
  useEffect(() => {
    // Função para resolver problemas detectados no relatório do Lighthouse
    const fixAccessibilityIssues = () => {
      // 1. Corrigir botões sem nome acessível
      document.querySelectorAll('button').forEach(button => {
        // Se o botão não tem um nome acessível (aria-label, aria-labelledby, texto interno)
        if (!button.hasAttribute('aria-label') && 
            !button.hasAttribute('aria-labelledby') && 
            button.textContent?.trim() === '') {
          
          // Tentar inferir um rótulo a partir do contexto
          // 1a. Verificar se contém ícones comuns
          if (button.querySelector('[data-lucide="menu"]')) {
            button.setAttribute('aria-label', 'Menu');
          } else if (button.querySelector('[data-lucide="x"]')) {
            button.setAttribute('aria-label', 'Fechar');
          } else if (button.querySelector('[data-lucide="search"]')) {
            button.setAttribute('aria-label', 'Pesquisar');
          } else if (button.querySelector('[data-lucide="filter"]')) {
            button.setAttribute('aria-label', 'Filtrar');
          } else if (button.querySelector('[data-lucide="arrow-left"]')) {
            button.setAttribute('aria-label', 'Voltar');
          } else if (button.querySelector('[data-lucide="arrow-right"]')) {
            button.setAttribute('aria-label', 'Avançar');
          } else if (button.querySelector('[data-lucide="chevron-left"]')) {
            button.setAttribute('aria-label', 'Anterior');
          } else if (button.querySelector('[data-lucide="chevron-right"]')) {
            button.setAttribute('aria-label', 'Próximo');
          } else if (button.querySelector('svg, img')) {
            // Se houver qualquer ícone, mas não sabemos qual
            button.setAttribute('aria-label', 'Botão com ícone');
          } else {
            // Último recurso: um rótulo genérico
            button.setAttribute('aria-label', 'Botão de ação');
          }
        }
        
        // Botões de alternância (switches) sem labels apropriados
        if (button.getAttribute('role') === 'switch') {
          if (!button.hasAttribute('aria-label')) {
            // Tentar encontrar uma label próxima para associar
            const closestLabel = button.closest('div')?.querySelector('label, span');
            if (closestLabel && closestLabel.textContent) {
              button.setAttribute('aria-label', closestLabel.textContent.trim());
            } else {
              button.setAttribute('aria-label', 'Alternar opção');
            }
          }
        }
      });
      
      // 2. Corrigir a meta viewport para permitir zoom
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        const content = viewport.getAttribute('content') || '';
        if (content.includes('maximum-scale=1') || content.includes('user-scalable=no')) {
          const newContent = content
            .replace(/maximum-scale=[^,]*,?/g, '')
            .replace(/user-scalable=[^,]*,?/g, '')
            .replace(/,\s*$/, '');
          viewport.setAttribute('content', newContent);
        }
      }
      
      // 3. Melhorar navegação por teclado
      document.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach(el => {
        // Garantir que elementos não visíveis ou desabilitados não recebam foco
        if (el instanceof HTMLElement) {
          const style = window.getComputedStyle(el);
          const isHidden = style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
          
          if (isHidden && el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1') {
            el.setAttribute('tabindex', '-1');
          }
        }
      });
      
      // 4. Verificar e corrigir imagens sem texto alternativo
      document.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('alt')) {
          // Verificar se a imagem é decorativa (em um background, etc)
          const style = window.getComputedStyle(img);
          const isDecorative = style.position === 'absolute' && 
                              (style.zIndex === '-1' || parseInt(style.zIndex) < 0);
          
          if (isDecorative) {
            // Imagens decorativas devem ter alt vazio e aria-hidden
            img.setAttribute('alt', '');
            img.setAttribute('aria-hidden', 'true');
          } else {
            // Tentar inferir um alt a partir do contexto
            const parent = img.parentElement;
            if (parent?.tagName === 'A' && parent.textContent?.trim()) {
              // Imagem dentro de um link com texto - usar o texto como alt
              img.setAttribute('alt', parent.textContent.trim());
            } else if (img.hasAttribute('src')) {
              // Extrair informação do URL como último recurso
              const src = img.getAttribute('src') || '';
              const filename = src.split('/').pop()?.split('?')[0] || '';
              if (filename) {
                // Remove extensão e converte traços/underlines em espaços
                const altFromFilename = filename
                  .replace(/\.\w+$/, '')
                  .replace(/[-_]/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize
                img.setAttribute('alt', altFromFilename || 'Imagem');
              } else {
                img.setAttribute('alt', 'Imagem');
              }
            } else {
              img.setAttribute('alt', 'Imagem');
            }
          }
        }
      });

      // 5. Corrigir ordem de cabeçalhos
      // Esta é uma correção parcial que apenas marca cabeçalhos fora de ordem
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (headings.length > 0) {
        let lastLevel = 0;
        headings.forEach(heading => {
          const level = parseInt(heading.tagName.substring(1));
          
          // Verificar se o nível pula mais de 1 (por exemplo, h2 para h4)
          if (lastLevel !== 0 && level > lastLevel + 1) {
            // Adicionar um atributo para debugging, não corrige mas marca o problema
            heading.setAttribute('data-a11y-heading-skip', `${lastLevel} to ${level}`);
            console.warn(`Acessibilidade: Pulo na hierarquia de títulos de h${lastLevel} para h${level}`, heading);
          }
          
          lastLevel = level;
        });
      }
    };

    // Executar as correções quando o DOM estiver pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fixAccessibilityIssues);
    } else {
      fixAccessibilityIssues();
    }

    // Executar novamente quando houver atualizações no DOM
    const observer = new MutationObserver((mutations) => {
      // Verificar se as mutações são relevantes para acessibilidade
      const relevantMutation = mutations.some(mutation => 
        mutation.type === 'childList' || 
        (mutation.type === 'attributes' && ['aria-label', 'alt', 'role'].includes(mutation.attributeName || ''))
      );
      
      if (relevantMutation) {
        fixAccessibilityIssues();
      }
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'alt', 'role', 'tabindex']
    });

    // Limpeza ao desmontar
    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}