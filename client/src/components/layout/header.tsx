import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/language-selector";

export default function Header() {
  const [location] = useLocation();
  const { t } = useTranslation();
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#0066FF] rounded-md flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
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
            {t('header.submitApp')}
          </Button>
          <LanguageSelector />
        </nav>
        
        {/* Mobile Menu */}
        <div className="md:hidden flex items-center space-x-2">
          <LanguageSelector />
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
                  {t('header.submitApp')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
