import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/language-selector";
import { useQuery } from "@tanstack/react-query";

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

// SVG logo as a React component for fallback use
function LogoSvg() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      width="32" 
      height="32" 
      className="text-white"
    >
      <rect width="24" height="24" rx="4" fill="#0066FF" />
      <g fill="currentColor">
        <polygon points="12 4 5 7.5 12 11 19 7.5 12 4" />
        <polyline points="5 15 12 18.5 19 15" strokeWidth="1" stroke="currentColor" fill="none" />
        <polyline points="5 11 12 14.5 19 11" strokeWidth="1" stroke="currentColor" fill="none" />
      </g>
    </svg>
  );
}

export default function Header() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { data: logoData, isLoading } = useBrandLogo();
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            {logoData?.url ? (
              <div className="h-8 flex items-center">
                <img 
                  src={logoData.url} 
                  alt="DesignGallery Logo" 
                  className="h-full w-auto"
                />
              </div>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center">
                <LogoSvg />
              </div>
            )}
            <span className="text-lg font-semibold">DesignGallery</span>
          </Link>
        </div>
        
        {/* Navigation (Desktop) */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className={`text-[#333333] hover:text-[#0066FF] font-medium ${location === '/' ? 'text-[#0066FF]' : ''}`}>
            {t('header.apps')}
          </Link>
          <Link href="/screens" className={`text-[#333333] hover:text-[#0066FF] font-medium ${location === '/screens' ? 'text-[#0066FF]' : ''}`}>
            {t('header.screens')}
          </Link>
          <Link href="/about" className={`text-[#333333] hover:text-[#0066FF] font-medium ${location === '/about' ? 'text-[#0066FF]' : ''}`}>
            {t('header.about')}
          </Link>
          <Button className="bg-[#0066FF] hover:bg-blue-700 text-white">
            {t('header.requestApp')}
          </Button>
        </nav>
        
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
                <Button className="bg-[#0066FF] hover:bg-blue-700 text-white mt-4">
                  {t('header.requestApp')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
