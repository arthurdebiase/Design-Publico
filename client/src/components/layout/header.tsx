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
            <div className="h-8 w-8 flex items-center justify-center">
              <img 
                src="/designpublico-logo.png" 
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
