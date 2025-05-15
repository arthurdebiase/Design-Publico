import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Screen, App } from "@/types";
import { X, Link2, ChevronLeft, ChevronRight, ExternalLink, Info } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { createSlug } from "@/lib/slugUtils";

interface ScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  screens: Screen[];
  currentScreenIndex: number;
  onScreenChange: (index: number) => void;
  app: App;
}

// Function to get component background color
const getTagColor = (tag: string): string => {
  type ColorMap = {
    [key: string]: string;
  };
  
  const colors: ColorMap = {
    'navigation': 'bg-blue-100',
    'form': 'bg-green-100',
    'chart': 'bg-purple-100',
    'modal': 'bg-yellow-100',
    'card': 'bg-pink-100', 
    'loading': 'bg-orange-100',
    'splash-screen': 'bg-teal-100',
    'avatar': 'bg-indigo-100',
    'button': 'bg-red-100',
    'filter': 'bg-cyan-100',
    'icon': 'bg-lime-100',
    'dropdown': 'bg-amber-100',
    'list': 'bg-violet-100',
    'input': 'bg-emerald-100',
    'onboarding': 'bg-sky-100',
    'callout': 'bg-rose-100'
  };
  
  const tagLower = tag.toLowerCase();
  // Default color for unknown tags
  return colors[tagLower] || 'bg-gray-100';
};

export function ScreenModal({
  isOpen,
  onClose,
  screens,
  currentScreenIndex,
  onScreenChange,
  app,
}: ScreenModalProps) {
  const [localIndex, setLocalIndex] = useState(currentScreenIndex);
  const [showTags, setShowTags] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  useEffect(() => {
    setLocalIndex(currentScreenIndex);
  }, [currentScreenIndex]);
  
  const currentScreen = screens[localIndex];
  
  const handlePrevious = () => {
    const newIndex = (localIndex - 1 + screens.length) % screens.length;
    setLocalIndex(newIndex);
    onScreenChange(newIndex);
  };
  
  const handleNext = () => {
    const newIndex = (localIndex + 1) % screens.length;
    setLocalIndex(newIndex);
    onScreenChange(newIndex);
  };
  
  const handleCopyLink = () => {
    // Create shareable URL with app slug and Airtable screen ID for better link sharing
    const baseUrl = window.location.origin;
    const appSlug = createSlug(app.name);
    const shareableUrl = `${baseUrl}/app/${appSlug}?screen=${currentScreen.airtableId}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareableUrl)
      .then(() => {
        // Show success toast
        toast({
          title: t("screens.linkCopied"),
          description: t("screens.linkCopiedDesc"),
          duration: 3000,
        });
      })
      .catch((error) => {
        console.error("Failed to copy link: ", error);
        // Fallback for browsers where clipboard API fails
        try {
          // Create a temporary input element
          const tempInput = document.createElement("input");
          tempInput.value = shareableUrl;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand("copy");
          document.body.removeChild(tempInput);
          
          toast({
            title: t("screens.linkCopied"),
            description: t("screens.linkCopiedDesc"),
            duration: 3000,
          });
        } catch (fallbackError) {
          console.error("Fallback copy method failed: ", fallbackError);
          toast({
            title: t("screens.copyFailed"),
            description: t("screens.copyFailedDesc"),
            variant: "destructive",
            duration: 3000,
          });
        }
      });
  };
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, localIndex, screens.length]);
  
  if (!currentScreen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col" hideCloseButton={true}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <Link href={`/app/${createSlug(app.name)}`} onClick={() => {
              onClose();
              // Ensure we scroll to top when navigating to app details
              window.scrollTo(0, 0);
            }}>
              <div className="w-10 h-10 flex items-center justify-center mr-3 cursor-pointer hover:opacity-80 transition-opacity" 
                title={`View ${app.name} details`}
                role="button"
                tabIndex={0}
              >
                {app.logo ? (
                  <ResponsiveImage 
                    src={app.logo} 
                    alt={`${app.name} logo`} 
                    className="w-8 h-8"
                    widths={[32, 64, 96]}
                    quality={90}
                    placeholder={
                      <div className="w-8 h-8 border rounded-md flex items-center justify-center font-bold text-gray-700">
                        {app.name.charAt(0)}
                      </div>
                    }
                  />
                ) : (
                  <div className="w-8 h-8 border rounded-md flex items-center justify-center font-bold text-gray-700">{app.name.charAt(0)}</div>
                )}
              </div>
            </Link>
            <div>
              {/* Logo only, no app name displayed as per requirements */}
              <DialogTitle className="sr-only">{app.name}</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 m-0">{currentScreen.name}</DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Show info button if there are tags or categories to display */}
            {((currentScreen.tags && currentScreen.tags.length > 0) || currentScreen.category) && (
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-9 w-9 ${showTags ? 'bg-gray-100' : ''}`} 
                aria-label={showTags ? "Hide metadata" : "Show metadata"}
                onClick={() => setShowTags(!showTags)}
                title={showTags ? "Hide componentes and categories" : "Show componentes and categories"}
              >
                <Info className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9" 
              aria-label={t("screens.linkCopiedDesc")}
              onClick={handleCopyLink}
              title={t("screens.linkCopiedDesc")}
            >
              <Link2 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="h-9 w-9" 
              aria-label="Fechar modal"
              title="Fechar"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-center relative">
          {screens.length > 1 && (
            <>
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-white/90 w-10 h-10 rounded-full shadow-md z-10" 
                onClick={handlePrevious}
                aria-label="Ver tela anterior"
                title={`Ver tela anterior: ${screens[(localIndex - 1 + screens.length) % screens.length].name}`}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </Button>
              
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white/90 w-10 h-10 rounded-full shadow-md z-10" 
                onClick={handleNext}
                aria-label="Ver próxima tela"
                title={`Ver próxima tela: ${screens[(localIndex + 1) % screens.length].name}`}
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </>
          )}
          
          <div className="relative max-w-full">
            <ResponsiveImage 
              src={currentScreen.imageUrl}
              alt={currentScreen.altText || `${app.name}: ${currentScreen.name} - ${currentScreen.description || 'Screen view'}`}
              className="max-h-[70vh] max-w-full rounded-lg shadow-md object-contain"
              aria-label={currentScreen.altText || `${app.name}: ${currentScreen.name} - ${currentScreen.description || 'Screen view'}`}
              placeholderClassName="w-full h-[70vh] flex items-center justify-center bg-gray-200 rounded-lg"
              placeholder={
                <div className="text-gray-500">Loading...</div>
              }
              sizes="(min-width: 1280px) 60vw, 90vw"
              widths={[480, 768, 1024, 1280]}
              format="webp"
              quality={90}
            />
          </div>
          
          {/* Tags and categories displayed here */}
          {showTags && (
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {/* Categories - Only visible when showTags is true */}
              {currentScreen.category && (
                <>
                  {typeof currentScreen.category === 'string' ? (
                    <Link 
                      href={`/screens?category=${encodeURIComponent(currentScreen.category)}`}
                      onClick={() => {
                        onClose();
                        // Ensure we scroll to top when navigating to filtered screens
                        window.scrollTo(0, 0);
                      }}
                      className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-medium hover:bg-purple-200 transition-colors cursor-pointer"
                      title={`View all screens in ${currentScreen.category} category`}
                    >
                      {currentScreen.category}
                    </Link>
                  ) : (
                    Array.isArray(currentScreen.category) && 
                    currentScreen.category.map((cat, idx) => (
                      <Link 
                        key={`modal-category-${idx}`}
                        href={`/screens?category=${encodeURIComponent(cat)}`}
                        onClick={() => {
                          onClose();
                          // Ensure we scroll to top when navigating to filtered screens
                          window.scrollTo(0, 0);
                        }}
                        className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-medium hover:bg-purple-200 transition-colors cursor-pointer"
                        title={`View all screens in ${cat} category`}
                      >
                        {cat}
                      </Link>
                    ))
                  )}
                </>
              )}
              
              {/* Tags - Only visible when showTags is true */}
              {currentScreen.tags && currentScreen.tags.length > 0 && (
                currentScreen.tags.map((tag, index) => (
                  <Link 
                    key={`modal-tag-${index}`}
                    href={`/screens?tag=${encodeURIComponent(tag)}`}
                    onClick={() => {
                      onClose();
                      // Ensure we scroll to top when navigating to filtered screens
                      window.scrollTo(0, 0);
                    }}
                    className={`text-sm px-3 py-1 rounded-full ${getTagColor(tag)} text-gray-800 hover:opacity-80 transition-opacity cursor-pointer`}
                    title={`View all screens with ${tag} componente`}
                  >
                    {tag}
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
