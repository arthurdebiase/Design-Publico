import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/language-selector";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
// Use the logo from the root directory
const symbolLogo = "/designpublico-symbol.png";

interface LogoResponse {
  url: string;
}

// Create a dedicated API hook for fetching the logo
function useBrandLogo() {
  return useQuery<LogoResponse>({
    queryKey: ['/api/brand/logo'],
    // The QueryClient default settings will handle the request
    retry: false, // Don't retry if it fails
    enabled: true, // Always try to fetch
  });
}

export default function Header() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 no-underline" aria-label="Ir para página inicial">
              <div className="h-8 w-8 flex items-center justify-center">
                <img 
                  src={symbolLogo} 
                  alt="Símbolo da Design Público" 
                  className="h-full w-auto"
                  aria-hidden="true" /* O texto do logo já fornece o conteúdo, portanto a imagem é decorativa */
                />
              </div>
              <span className="flex items-center text-black" aria-label="Design Público">
                <span style={{ fontFamily: '"Arial Black", sans-serif', fontWeight: 900 }}>DESIGN</span>
                <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700 }} className="ml-1">PÚBLICO</span>
              </span>
            </Link>
          </div>
          
          {/* Navigation (Desktop) */}
          <div className="hidden md:flex items-center">
            <nav className="flex items-center space-x-6 mr-6">
              <Link href="/" className={`text-[#333333] hover:text-[#0066FF] font-medium no-underline ${location === '/' ? 'text-[#0066FF]' : ''}`}>
                {t('header.apps')}
              </Link>
              <Link href="/screens" className={`text-[#333333] hover:text-[#0066FF] font-medium no-underline ${location === '/screens' ? 'text-[#0066FF]' : ''}`}>
                {t('header.screens')}
              </Link>
              <Link href="/about" className={`text-[#333333] hover:text-[#0066FF] font-medium no-underline ${location === '/about' ? 'text-[#0066FF]' : ''}`}>
                {t('header.about')}
              </Link>
            </nav>
            
            {/* Language selector */}
            <div className="border-l border-gray-200 pl-4">
              <LanguageSelector />
            </div>
          </div>
          
          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Toggle mobile menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative p-2 h-12 w-12"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-8 w-8" aria-hidden="true" />
              ) : (
                <Menu className="h-8 w-8" aria-hidden="true" />
              )}
              <span className="sr-only">{mobileMenuOpen ? "Close menu" : "Open menu"}</span>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu - Overlay on content */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed z-50 bg-white shadow-lg right-0 left-0" style={{ top: "61px" }}>
          <nav className="flex flex-col space-y-5 p-4">
            <Link 
              href="/" 
              className={`text-lg font-medium no-underline ${location === '/' ? 'text-[#0066FF]' : 'text-[#333333] hover:text-[#0066FF]'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('header.apps')}
            </Link>
            <Link 
              href="/screens" 
              className={`text-lg font-medium no-underline ${location === '/screens' ? 'text-[#0066FF]' : 'text-[#333333] hover:text-[#0066FF]'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('header.screens')}
            </Link>
            <Link 
              href="/about" 
              className={`text-lg font-medium no-underline ${location === '/about' ? 'text-[#0066FF]' : 'text-[#333333] hover:text-[#0066FF]'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('header.about')}
            </Link>
            
            {/* Language selector for mobile */}
            <div className="pt-2 mt-2 border-t border-gray-200">
              <LanguageSelector />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
