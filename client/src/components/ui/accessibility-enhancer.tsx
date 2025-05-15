import React, { useEffect } from 'react';

interface AccessibilityEnhancerProps {
  /**
   * Define se deve corrigir problemas de contraste automaticamente
   */
  fixContrast?: boolean;
  
  /**
   * Define se deve aplicar correções para leitores de tela
   */
  enhanceScreenReaders?: boolean;
  
  /**
   * Define se deve melhorar a navegação por teclado
   */
  improveKeyboardNavigation?: boolean;
  
  /**
   * Define se deve adicionar descrições adicionais para elementos
   */
  addDescriptions?: boolean;
}

/**
 * AccessibilityEnhancer
 * 
 * Componente para aplicar melhorias automáticas de acessibilidade no site,
 * ajudando a corrigir problemas comuns encontrados em relatórios do Lighthouse
 * e melhorando a experiência para usuários com tecnologias assistivas.
 */
export const AccessibilityEnhancer: React.FC<AccessibilityEnhancerProps> = ({
  fixContrast = true,
  enhanceScreenReaders = true,
  improveKeyboardNavigation = true,
  addDescriptions = true
}) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    // Conjunto de melhorias de acessibilidade a aplicar
    const cleanup: Function[] = [];
    
    // 1. Melhoria de contraste para texto
    if (fixContrast) {
      const style = document.createElement('style');
      style.setAttribute('data-a11y', 'true');
      // Aplica regras CSS para melhorar contraste
      style.textContent = `
        /* Garantir contraste mínimo para texto pequeno (4.5:1) */
        .text-gray-400, .text-gray-500 {
          color: #6b7280 !important; /* Cinza mais escuro para melhor contraste */
        }
        
        /* Garantir que links são distinguíveis do texto ao redor */
        a:not(.btn):not([role="button"]) {
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        /* Melhorar visibilidade do foco no teclado */
        *:focus-visible {
          outline: 3px solid #13A15F !important;
          outline-offset: 2px !important;
        }
      `;
      document.head.appendChild(style);
      
      cleanup.push(() => {
        document.head.removeChild(style);
      });
    }
    
    // 2. Melhorias para leitores de tela
    if (enhanceScreenReaders) {
      // Garantir que todas as imagens tenham alt text
      const enhanceImages = () => {
        document.querySelectorAll('img:not([alt])').forEach(img => {
          const imgEl = img as HTMLImageElement;
          // Obter texto alternativo do contexto
          let altText = '';
          
          // Tentar obter do title, aria-label ou texto próximo
          if (imgEl.title) {
            altText = imgEl.title;
          } else if (imgEl.parentElement?.textContent) {
            // Simplificar o texto próximo para gerar um alt
            const nearbyText = imgEl.parentElement.textContent.trim().substring(0, 50);
            if (nearbyText) {
              altText = `Imagem relacionada a: ${nearbyText}`;
            }
          }
          
          // Se não encontrou nada, usar um padrão que indica que é decorativa
          if (!altText) {
            imgEl.setAttribute('alt', '');
            imgEl.setAttribute('aria-hidden', 'true');
            imgEl.setAttribute('role', 'presentation');
          } else {
            imgEl.setAttribute('alt', altText);
          }
        });
      };
      
      // Executar imediatamente
      enhanceImages();
      
      // E também quando o DOM mudar
      const observer = new MutationObserver(enhanceImages);
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
      
      cleanup.push(() => {
        observer.disconnect();
      });
    }
    
    // 3. Melhorias para navegação por teclado
    if (improveKeyboardNavigation) {
      // Adicionar role=button e tabindex para elementos clicáveis sem role
      const enhanceButtons = () => {
        document.querySelectorAll('[onClick]:not([role]):not(button):not(a):not(input):not(select):not(textarea)').forEach(el => {
          if (!el.hasAttribute('tabindex')) {
            el.setAttribute('tabindex', '0');
          }
          
          if (!el.hasAttribute('role')) {
            el.setAttribute('role', 'button');
          }
          
          // Marcamos como já melhorado para acessibilidade
          if (!el.hasAttribute('data-a11y-enhanced')) {
            el.setAttribute('data-a11y-enhanced', 'true');
            
            // Nota: Não adicionamos event listeners dinamicamente para evitar
            // problemas de tipagem e memória. Recomendamos implementar isso
            // diretamente nos componentes React originais.
          }
        });
      };
      
      // Executar imediatamente
      enhanceButtons();
      
      // E também quando o DOM mudar
      const observer = new MutationObserver(enhanceButtons);
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['onClick']
      });
      
      cleanup.push(() => {
        observer.disconnect();
      });
    }
    
    // 4. Adicionar descrições para elementos que precisam
    if (addDescriptions) {
      const enhanceDescriptions = () => {
        // Para ícones sem texto, adicionar aria-label para leitores de tela
        document.querySelectorAll('[class*="icon"]:not([aria-label]):not([aria-hidden="true"])').forEach(icon => {
          // Tentar determinar o propósito do ícone
          let label = '';
          
          // Se está dentro de um botão, usar o texto do botão
          const buttonParent = icon.closest('button, [role="button"]');
          if (buttonParent && buttonParent.textContent?.trim()) {
            label = buttonParent.textContent.trim();
          }
          
          // Se é um ícone puramente decorativo, esconder dos leitores
          if (!label) {
            icon.setAttribute('aria-hidden', 'true');
          } else {
            icon.setAttribute('aria-label', label);
          }
        });
      };
      
      // Executar imediatamente
      enhanceDescriptions();
      
      // E também quando o DOM mudar
      const observer = new MutationObserver(enhanceDescriptions);
      observer.observe(document.body, { 
        childList: true, 
        subtree: true
      });
      
      cleanup.push(() => {
        observer.disconnect();
      });
    }
    
    // Limpar todas as melhorias na desmontagem
    return () => {
      cleanup.forEach(fn => fn());
    };
  }, [fixContrast, enhanceScreenReaders, improveKeyboardNavigation, addDescriptions]);
  
  return null; // Componente não renderiza nada visualmente
};

export default AccessibilityEnhancer;