import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Screen, App } from "@/types";
import { X, Link2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface ScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  screens: Screen[];
  currentScreenIndex: number;
  onScreenChange: (index: number) => void;
  app: App;
}

export function ScreenModal({
  isOpen,
  onClose,
  screens,
  currentScreenIndex,
  onScreenChange,
  app,
}: ScreenModalProps) {
  const [localIndex, setLocalIndex] = useState(currentScreenIndex);
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
    // Create shareable URL with app ID and screen ID
    const baseUrl = window.location.origin;
    const shareableUrl = `${baseUrl}/app/${app.id}?screen=${currentScreen.id}`;
    
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
            <div className="w-10 h-10 flex items-center justify-center mr-3">
              {app.logo ? (
                <img src={app.logo} alt={`${app.name} logo`} className="w-8 h-8" />
              ) : (
                <div className="w-8 h-8 border rounded-md flex items-center justify-center font-bold text-gray-700">{app.name.charAt(0)}</div>
              )}
            </div>
            <div>
              {/* Logo only, no app name displayed as per requirements */}
              <DialogTitle className="sr-only">{app.name}</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 m-0">{currentScreen.name}</DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
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
              aria-label="Close modal"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 p-4 sm:p-6 flex items-center justify-center relative">
          {screens.length > 1 && (
            <>
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-white/90 w-10 h-10 rounded-full shadow-md z-10" 
                onClick={handlePrevious}
                aria-label="View previous screen"
                title={`View previous screen: ${screens[(localIndex - 1 + screens.length) % screens.length].name}`}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </Button>
              
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white/90 w-10 h-10 rounded-full shadow-md z-10" 
                onClick={handleNext}
                aria-label="View next screen"
                title={`View next screen: ${screens[(localIndex + 1) % screens.length].name}`}
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </>
          )}
          
          <div className="relative max-w-full">
            <img 
              src={currentScreen.imageUrl} 
              alt={`${app.name}: ${currentScreen.name} - ${currentScreen.description || 'Screen view'}`} 
              className="max-h-[70vh] max-w-full rounded-lg shadow-md object-contain"
              aria-label={`${app.name}: ${currentScreen.name} - ${currentScreen.description || 'Screen view'}`}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
