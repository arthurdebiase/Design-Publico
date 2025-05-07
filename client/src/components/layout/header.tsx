import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/language-selector";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

// Attempt multiple paths for the logo to ensure at least one works in production
const LOGO_PATHS = [
  "/designpublico-symbol.png", 
  "/symbol.png",
  "/public/symbol.png", 
  "/static/symbol.png",
  "/attached_assets/symbol.png"
];

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
  
  const [logoPath, setLogoPath] = useState(LOGO_PATHS[0]);

  // Function to handle image loading errors
  const handleImageError = () => {
    // Try the next logo path in the list
    const currentIndex = LOGO_PATHS.indexOf(logoPath);
    if (currentIndex < LOGO_PATHS.length - 1) {
      setLogoPath(LOGO_PATHS[currentIndex + 1]);
    } else {
      // If all paths failed, use an inline SVG
      setLogoPath('');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 flex items-center justify-center">
              {logoPath ? (
                <img 
                  src={logoPath} 
                  alt={t('header.logo_alt')}
                  className="h-full w-auto"
                  onError={handleImageError}
                />
              ) : (
                // Fallback SVG as inline component
                <svg 
                  viewBox="0 0 32 32" 
                  className="h-full w-auto" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="32" height="32" fill="black" />
                  <path d="M8 8h16v16H8z" fill="white" />
                </svg>
              )}
            </div>
            <span className="flex items-center">
              <span style={{ fontFamily: 'Arial Black, Arial', fontWeight: 900 }}>DESIGN</span>
              <span style={{ fontFamily: 'Arial', fontWeight: 700 }} className="ml-1">PÚBLICO</span>
            </span>
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
