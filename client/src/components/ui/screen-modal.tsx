import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Screen, App } from "@shared/schema";
import { X, Link2, ChevronLeft, ChevronRight, ExternalLink, Info } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { createSlug } from "@/lib/slugUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import "./bottom-sheet.css";

interface ScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  screens: Array<Screen & { category?: string | string[] | null }>;
  currentScreenIndex: number;
  onScreenChange: (index: number) => void;
  app: App & { airtableId?: string, slug?: string | null };
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
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [location] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  // Use isMobile hook to adjust UI for mobile devices
  const isMobile = useIsMobile();
  // Track animation state
  const [isClosing, setIsClosing] = useState(false);
  
  // Add a flag for the DOM mounting to help with animation timing
  const [isMounted, setIsMounted] = useState(false);
  
  // Add state to track previous mobile state for smoother transitions
  const [wasMobile, setWasMobile] = useState(isMobile);
  
  // Update wasMobile when isMobile changes, but with a slight delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setWasMobile(isMobile);
    }, 300); // 300ms delay matches the transition time
    
    return () => clearTimeout(timer);
  }, [isMobile]);
  
  useEffect(() => {
    setLocalIndex(currentScreenIndex);
    // Sempre que mudar de tela, reiniciar o estado de carregamento
    setIsImageLoading(true);
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
    <Dialog 
      open={isOpen} 
      modal={true}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent 
        className={`${isMobile 
          ? `p-0 overflow-hidden flex flex-col bottom-sheet-content w-screen m-0 pb-safe h-auto`
          : "max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col"
        } transition-all duration-300`}
        hideCloseButton={true}
      >
        {/* Handle indicator for mobile bottom sheet */}
        {isMobile && (
          <div className="w-full flex justify-center pt-1 pb-0 mb-0">
            <div className="bottom-sheet-handle"></div>
          </div>
        )}
        
        {/* Required for accessibility - this is a visually hidden title that screen readers will announce */}
        <DialogTitle className="sr-only">
          {app.name}: {currentScreen.name || 'Screen Detail'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {t('screenModal.description', 'Detailed view of a screen from {{appName}}. Use arrow keys to navigate between screens.', { appName: app.name })}
        </DialogDescription>
        <div className={`flex items-center justify-between p-4 pt-2 ${isMobile ? 'pb-2' : 'border-b'}`}>
          <Link href={`/app/${createSlug(app.name)}`} 
            className="flex items-center group no-underline" 
            onClick={() => {
              onClose();
              // Ensure we scroll to top when navigating to app details
              window.scrollTo(0, 0);
            }}
          >
            <div className="flex-shrink-0 w-8 h-8 mr-3 cursor-pointer hover:opacity-80 transition-opacity" 
              title={`View ${app.name} details`}
            >
              {app.logo ? (
                <ResponsiveImage 
                  src={app.logo}
                  cloudinarySrc={app.cloudinaryLogo}
                  alt={`${app.name} logo`} 
                  className="w-8 h-8 object-contain"
                  widths={[32, 64, 96]}
                  quality={90}
                  format="webp"
                  priority={true}
                  placeholder={
                    <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                      <span className="sr-only">Loading logo for {app.name}</span>
                    </div>
                  }
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="sr-only">Logo placeholder for {app.name}</span>
                </div>
              )}
            </div>
            <div className="flex-grow">
              {/* App and screen name - clickable */}
              <div className="flex flex-col">
                <h3 className="text-sm text-gray-700 font-medium m-0 group-hover:text-blue-600 transition-colors truncate max-w-[180px]" title={currentScreen.name}>{currentScreen.name || "..."}</h3>
                
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 m-0 truncate max-w-[180px]" title={app.name}>{app.name || "..."}</span>
                </div>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            {/* Show info button if there are tags to display */}
            {(currentScreen.tags && currentScreen.tags.length > 0) && (
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-9 w-9 ${showTags ? 'bg-gray-100' : ''}`} 
                aria-label={showTags ? "Hide components" : "Show components"}
                onClick={() => setShowTags(!showTags)}
                title={showTags ? "Hide components" : "Show components"}
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
        
        <div className="flex-1 p-0 flex flex-col items-center justify-center relative">
          {screens.length > 1 && (
            <>
              <Button 
                variant="secondary" 
                size="icon" 
                className={`absolute left-1 top-1/2 transform -translate-y-1/2 bg-white/90 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full shadow-md z-10`}
                onClick={handlePrevious}
                aria-label="Ver tela anterior"
                title={`Ver tela anterior: ${screens[(localIndex - 1 + screens.length) % screens.length].name}`}
              >
                <ChevronLeft className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} aria-hidden="true" />
              </Button>
              
              <Button 
                variant="secondary" 
                size="icon" 
                className={`absolute right-1 top-1/2 transform -translate-y-1/2 bg-white/90 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full shadow-md z-10`}
                onClick={handleNext}
                aria-label="Ver próxima tela"
                title={`Ver próxima tela: ${screens[(localIndex + 1) % screens.length].name}`}
              >
                <ChevronRight className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} aria-hidden="true" />
              </Button>
            </>
          )}
          
          {/* Skeleton placeholder with fixed dimensions to prevent layout shifts */}
          <div className={`${isMobile ? 'h-[70vh] w-full' : 'h-[68vh] w-auto'} flex items-center justify-center ${!isImageLoading ? 'hidden' : ''}`}>
            <div 
              className="animate-pulse bg-white border border-gray-200 rounded-md" 
              style={{ 
                width: isMobile ? '100%' : '380px',
                height: isMobile ? '70vh' : '68vh',
                maxWidth: '100%',
                aspectRatio: '9/16'
              }}
            />
          </div>
          
          {/* Container for both image and tags */}
          <div className="w-full flex flex-col items-center justify-center space-y-4">
            {/* Main image - fixed height container to prevent layout shifts */}
            <div className={`flex-1 w-full flex items-center justify-center overflow-hidden p-0 ${isMobile ? 'pb-safe h-[70vh]' : 'h-[68vh]'}`}>
                <CloudinaryImage 
                  src={currentScreen.imageUrl}
                  cloudinarySrc={currentScreen.cloudinaryUrl || undefined}
                  alt={currentScreen.altText || `${app.name}: ${currentScreen.name} - ${currentScreen.description || 'Screen view'}`}
                  className={`${isMobile ? 'max-h-[65vh] w-auto' : 'max-h-[68vh] w-auto'} object-contain ${isImageLoading ? 'hidden' : 'block'}`}
                  onLoad={() => setIsImageLoading(false)}
                  priority={true}
                  width={1024}
                  height={1820}
                />
            </div>
            
            {/* Mobile-specific toggle for details - removed */}
              
            {/* Component tags displayed here */}
            {showTags && (
              <div className="flex flex-wrap gap-2 mt-2 justify-center px-4">
                {/* Tags - Showing only component tags */}
                {currentScreen.tags && currentScreen.tags.length > 0 && (
                  currentScreen.tags.map((tag, index) => (
                    <span 
                      key={`modal-tag-${index}`}
                      onClick={() => {
                        onClose();
                        // Ensure we scroll to top when navigating to filtered screens
                        window.location.href = `/screens?tag=${encodeURIComponent(tag)}`;
                        window.scrollTo(0, 0);
                      }}
                      className={`text-sm px-3 py-1 rounded-full ${getTagColor(tag)} text-gray-800 hover:opacity-80 transition-opacity cursor-pointer no-underline`}
                      title={`View all screens with ${tag} componente`}
                    >
                      {tag}
                    </span>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
