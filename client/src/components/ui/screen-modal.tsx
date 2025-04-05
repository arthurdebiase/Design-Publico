import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Screen, App } from "@/types";
import { X, Download, Share2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";

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
              <DialogTitle className="font-medium text-base m-0 p-0">{app.name}</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 m-0">{currentScreen.name}</DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 p-4 sm:p-6 flex items-center justify-center">
          <div className="relative max-w-full">
            <img 
              src={currentScreen.imageUrl} 
              alt={currentScreen.name || `Screen from ${app.name}`} 
              title={currentScreen.name || ''}
              className="max-h-[70vh] max-w-full rounded-lg shadow-md object-contain"
              aria-label={currentScreen.name || `Screen from ${app.name}`}
            />
            
            {screens.length > 1 && (
              <>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white w-10 h-10 rounded-full shadow-md" 
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white w-10 h-10 rounded-full shadow-md" 
                  onClick={handleNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
