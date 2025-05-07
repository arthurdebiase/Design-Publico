import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/language-selector";
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
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 flex items-center justify-center">
              <img 
                src={symbolLogo} 
                alt="Design Público Logo" 
                className="h-full w-auto"
              />
            </div>
            <span className="flex items-center">
              <span style={{ fontFamily: 'Arial Black, Arial', fontWeight: 900 }}>DESIGN</span>
              <span style={{ fontFamily: 'Arial', fontWeight: 700 }} className="ml-1">PÚBLICO</span>
            </span>
          </Link>
        </div>
        
        {/* Navigation (Desktop) */}
        <div className="hidden md:flex items-center">
          <nav className="flex items-center space-x-6 mr-6">
            <Link href="/" className={`text-[#333333] hover:text-[#0066FF] font-medium ${location === '/' ? 'text-[#0066FF]' : ''}`}>
              {t('header.apps')}
            </Link>
            <Link href="/screens" className={`text-[#333333] hover:text-[#0066FF] font-medium ${location === '/screens' ? 'text-[#0066FF]' : ''}`}>
              {t('header.screens')}
            </Link>
            <Link href="/about" className={`text-[#333333] hover:text-[#0066FF] font-medium ${location === '/about' ? 'text-[#0066FF]' : ''}`}>
              {t('header.about')}
            </Link>
          </nav>
          
          {/* Language selector */}
          <div className="border-l border-gray-200 pl-4">
            <LanguageSelector />
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className="md:hidden flex items-center space-x-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="mt-8 flex flex-col space-y-4">
                <Link href="/" className="text-lg font-medium hover:text-[#0066FF]">
                  {t('header.apps')}
                </Link>
                <Link href="/screens" className="text-lg font-medium hover:text-[#0066FF]">
                  {t('header.screens')}
                </Link>
                <Link href="/about" className="text-lg font-medium hover:text-[#0066FF]">
                  {t('header.about')}
                </Link>
                
                {/* Language selector for mobile */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">{t('language.select')}:</span>
                    <LanguageSelector />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
