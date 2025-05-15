import { useEffect } from 'react';

/**
 * AccessibilityEnhancer Component
 * 
 * Este componente melhora a acessibilidade da aplicação:
 * - Adiciona atributos ARIA faltantes em elementos interativos
 * - Corrige contraste e tamanho de fontes com problemas
 * - Implementa tratamento de teclado para elementos interativos
 * - Corrige problemas com zoom em dispositivos móveis
 */
export function AccessibilityEnhancer() {
  useEffect(() => {
    // Corrige atributos aria faltantes em elementos interativos
    const fixAriaAttributes = () => {
      // 1. Botões sem rótulos
      document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach((btn) => {
        const button = btn as HTMLButtonElement;
        // Se não tem texto visível, tenta encontrar um rótulo baseado em ícones ou contexto
        if (!button.innerText.trim()) {
          // Checa ícones dentro do botão
          const icon = button.querySelector('svg, img, i');
          if (icon) {
            // Determina uma descrição baseado na classe do ícone ou atributos
            const iconClass = icon.className;
            if (iconClass.includes('close') || iconClass.includes('x')) {
              button.setAttribute('aria-label', 'Fechar');
            } else if (iconClass.includes('menu') || iconClass.includes('hamburger')) {
              button.setAttribute('aria-label', 'Menu');
            } else if (iconClass.includes('search')) {
              button.setAttribute('aria-label', 'Buscar');
            } else {
              // Tenta usar o title ou alt se disponível
              const title = (icon as HTMLElement).getAttribute('title') || 
                           (icon as HTMLImageElement).getAttribute('alt');
              if (title) {
                button.setAttribute('aria-label', title);
              }
            }
          }
        }
      });
      
      // 2. Links sem texto
      document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])').forEach((link) => {
        if (!link.innerText.trim()) {
          const img = link.querySelector('img');
          if (img && img.alt) {
            link.setAttribute('aria-label', img.alt);
          }
        }
      });
      
      // 3. Inputs sem labels associados
      document.querySelectorAll('input:not([type="hidden"])').forEach((input) => {
        const inputId = input.id;
        if (inputId) {
          const hasLabel = document.querySelector(`label[for="${inputId}"]`);
          if (!hasLabel && !input.getAttribute('aria-label')) {
            // Tenta usar o placeholder como fallback
            const placeholder = input.getAttribute('placeholder');
            if (placeholder) {
              input.setAttribute('aria-label', placeholder);
            }
          }
        } else if (!input.getAttribute('aria-label')) {
          // Input sem ID e sem aria-label
          const placeholder = input.getAttribute('placeholder');
          if (placeholder) {
            input.setAttribute('aria-label', placeholder);
          }
        }
      });
    };

    // Melhorar contraste e layout para acessibilidade
    const fixContrastAndLayout = () => {
      // 1. Garantir que a meta tag viewport permite zoom
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        const content = viewportMeta.getAttribute('content') || '';
        if (content.includes('maximum-scale=1') || content.includes('user-scalable=no')) {
          // Corrige para permitir zoom
          const newContent = content
            .replace(/maximum-scale=[^,]*,?/g, '')
            .replace(/user-scalable=no,?/g, '')
            .trim();
          viewportMeta.setAttribute('content', newContent);
        }
      }
      
      // 2. Verificar tamanho mínimo de texto
      document.querySelectorAll('p, span, div, button, a').forEach((element) => {
        const style = window.getComputedStyle(element);
        const fontSize = parseFloat(style.fontSize);
        
        // Texto menor que 12px pode ser difícil de ler
        if (fontSize < 12 && element.innerText.trim()) {
          element.style.fontSize = '12px';
        }
      });
      
      // 3. Melhorar contraste para elementos interativos
      document.querySelectorAll('button, a, input, select, textarea').forEach((element) => {
        const style = window.getComputedStyle(element);
        const color = style.color;
        const background = style.backgroundColor;
        
        // Análise simplificada - implementações mais robustas usariam WCAG contrast calculator
        // Este é apenas um exemplo, não uma implementação completa
        if (color === 'rgba(0, 0, 0, 0)' || background === 'rgba(0, 0, 0, 0)') {
          // Elementos transparentes não precisam de ajuste
          return;
        }
        
        // Adicionar outline quando elemento recebe foco via teclado
        element.addEventListener('focus', (e) => {
          if (e.target && (e.target as HTMLElement).classList) {
            (e.target as HTMLElement).classList.add('keyboard-focus');
          }
        });
        
        element.addEventListener('blur', (e) => {
          if (e.target && (e.target as HTMLElement).classList) {
            (e.target as HTMLElement).classList.remove('keyboard-focus');
          }
        });
      });
    };

    // Adiciona suporte a navegação por teclado
    const enhanceKeyboardNavigation = () => {
      // Adiciona event listeners para elementos que não são nativamente focáveis
      document.querySelectorAll('[role="button"]:not(button):not(a), [role="tab"]:not(button):not(a)').forEach((element) => {
        if (!element.getAttribute('tabindex')) {
          element.setAttribute('tabindex', '0');
        }
        
        // Adiciona suporte a ativação por teclado
        element.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            (element as HTMLElement).click();
          }
        });
      });
      
      // Verifica se temos marcação adequada para regiões
      if (!document.querySelector('main, [role="main"]')) {
        const mainContent = document.querySelector('#root > div > div:not(header):not(footer)');
        if (mainContent) {
          mainContent.setAttribute('role', 'main');
        }
      }
      
      // Verifica se todas as imagens têm texto alternativo
      document.querySelectorAll('img:not([alt])').forEach((img) => {
        const parent = img.closest('figure');
        if (parent) {
          const figcaption = parent.querySelector('figcaption');
          if (figcaption) {
            img.alt = figcaption.innerText.trim();
          } else {
            img.alt = ''; // Marca como decorativa
          }
        } else {
          // Para imagens decorativas
          img.alt = '';
        }
      });
    };
    
    // Injetar estilos de acessibilidade no head
    const injectAccessibilityStyles = () => {
      const styleId = 'accessibility-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          /* Estilos para foco via teclado */
          .keyboard-focus {
            outline: 3px solid #13A15F !important;
            outline-offset: 2px !important;
          }
          
          /* Garante contraste adequado em elementos com foco */
          :focus {
            outline-color: #13A15F;
            outline-style: solid;
            outline-width: 2px;
          }
          
          /* Oculta elementos focáveis apenas quando não têm foco via teclado */
          .sr-only:not(:focus):not(:active) {
            clip: rect(0, 0, 0, 0);
            clip-path: inset(50%);
            height: 1px;
            width: 1px;
            overflow: hidden;
            position: absolute;
            white-space: nowrap;
          }
        `;
        document.head.appendChild(style);
      }
    };
    
    // Monitora alterações na DOM para continuar aplicando as melhorias
    const setupMutationObserver = () => {
      const observer = new MutationObserver((mutations) => {
        // Verifica se as mutações são relevantes (adição de novos elementos)
        let shouldUpdate = false;
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            shouldUpdate = true;
          }
        });
        
        if (shouldUpdate) {
          // Aplica todas as melhorias aos novos elementos
          fixAriaAttributes();
          fixContrastAndLayout();
          enhanceKeyboardNavigation();
        }
      });
      
      // Inicia a observação no elemento root
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      return observer;
    };
    
    // Executa todas as melhorias
    injectAccessibilityStyles();
    fixAriaAttributes();
    fixContrastAndLayout();
    enhanceKeyboardNavigation();
    
    // Observa mudanças na DOM para manter as melhorias
    const observer = setupMutationObserver();
    
    return () => {
      // Limpa o observer quando o componente for desmontado
      observer.disconnect();
    };
  }, []);

  return null;
}