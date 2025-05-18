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
      onOpenChange={(open) => {
        if (!open && isMobile) {
          // First start the closing animation
          setIsClosing(true);
          // Then close the dialog after animation completes
          setTimeout(() => {
            onClose();
            setIsClosing(false);
          }, 300);
        } else if (!open) {
          // For desktop, close immediately
          onClose();
        }
      }}
    >
      <DialogContent 
        className={`${isMobile 
          ? `w-[100vw] p-0 overflow-hidden flex flex-col mobile-dialog-content ${isClosing ? 'sheet-slide-down' : 'sheet-slide-up'}`
          : "max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col"
        }`}
        style={isMobile ? { 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100vw',
          margin: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          transform: 'none'
        } : undefined}
        hideCloseButton={true}
        aria-labelledby="screen-modal-title"
        aria-describedby="screen-modal-description"
      >
        {/* Handle indicator for mobile bottom sheet */}
        {isMobile && (
          <div className="w-full flex justify-center pt-2 pb-1">
            <div className="bottom-sheet-handle"></div>
          </div>
        )}
        
        {/* Add proper DialogTitle and DialogDescription for accessibility */}
        <DialogTitle id="screen-modal-title" className="sr-only">
          {app.name}: {currentScreen.name || 'Screen Detail'}
        </DialogTitle>
        <DialogDescription id="screen-modal-description" className="sr-only">
          {t('screenModal.description', 'Detailed view of a screen from {{appName}}. Use arrow keys to navigate between screens.', { appName: app.name })}
        </DialogDescription>
        

        
        <div className={`flex items-center justify-between p-4 ${isMobile ? 'pb-2' : 'border-b'}`}>
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
                <img 
                  src={app.cloudinaryLogo || app.logo}
                  alt={`${app.name} logo`} 
                  className="w-8 h-8 object-contain"
                  loading="eager"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="sr-only">Logo placeholder for {app.name}</span>
                </div>
              )}
            </div>
            <div className="flex-grow">
              {/* App and screen name - clickable */}
              <DialogTitle id="screen-modal-title" className="text-sm text-gray-700 font-medium m-0 group-hover:text-blue-600 transition-colors">{currentScreen.name}</DialogTitle>
              <DialogDescription id="screen-modal-description" className="text-xs text-gray-500 m-0">{app.name}</DialogDescription>
            </div>
          </Link>
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
          
          {/* Skeleton placeholder that matches image container dimensions */}
          {isImageLoading && (
            <div className={`${isMobile ? 'max-h-[70vh] w-full' : 'max-h-[68vh]'} flex items-center justify-center`}>
              <div 
                className="animate-pulse bg-gray-200 rounded-md" 
                style={{ 
                  width: '100%',
                  height: isMobile ? '70vh' : '68vh',
                  maxWidth: '100%',
                  aspectRatio: '9/16',
                  maxHeight: isMobile ? '70vh' : '68vh'
                }}
              />
            </div>
          )}
          
          {/* Container for both image and tags */}
          <div className="w-full flex flex-col items-center justify-center space-y-4 pb-4">
            {/* Imagem principal - usando o componente CloudinaryImage para garantir consistência */}
            <div className={`${isMobile ? 'max-h-[70vh] w-full' : 'max-h-[68vh]'} flex items-center justify-center`}>
              <a 
                href={currentScreen.cloudinaryUrl || currentScreen.imageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="cursor-pointer hover:opacity-90 transition-opacity w-full flex justify-center"
                title="Open full image in new tab"
              >
                <CloudinaryImage 
                  src={currentScreen.imageUrl}
                  cloudinarySrc={currentScreen.cloudinaryUrl || undefined}
                  alt={currentScreen.altText || `${app.name}: ${currentScreen.name} - ${currentScreen.description || 'Screen view'}`}
                  className={`${isMobile ? 'max-h-[70vh] max-w-[95%]' : 'max-h-[68vh]'} w-auto object-contain ${isImageLoading ? 'hidden' : 'block'}`}
                  onLoad={() => setIsImageLoading(false)}
                  priority={true}
                  width={1024}
                  height={1820}
                />
              </a>
            </div>
            
            {/* Mobile-specific toggle for details - removed */}
              
            {/* Tags and categories displayed here */}
            {showTags && (
              <div className="flex flex-wrap gap-2 mt-2 justify-center px-4">
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
                        className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-medium hover:bg-purple-200 transition-colors cursor-pointer no-underline"
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
                          className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-medium hover:bg-purple-200 transition-colors cursor-pointer no-underline"
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
                      className={`text-sm px-3 py-1 rounded-full ${getTagColor(tag)} text-gray-800 hover:opacity-80 transition-opacity cursor-pointer no-underline`}
                      title={`View all screens with ${tag} componente`}
                    >
                      {tag}
                    </Link>
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
