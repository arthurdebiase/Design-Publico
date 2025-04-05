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
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col" closeButton={false}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mr-3">
              {app.logo ? (
                <img src={app.logo} alt={`${app.name} logo`} className="w-6 h-6" />
              ) : (
                <div className="text-white font-bold">{app.name.charAt(0)}</div>
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
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
          <div className="relative">
            <img 
              src={currentScreen.imageUrl} 
              alt={currentScreen.name} 
              className="max-h-[70vh] rounded-lg shadow-lg"
            />
            
            {screens.length > 1 && (
              <>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 ml-1 bg-white w-10 h-10 rounded-full shadow-md" 
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-1 bg-white w-10 h-10 rounded-full shadow-md" 
                  onClick={handleNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        <DialogFooter className="p-4 border-t flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">
              Screen {localIndex + 1} of {screens.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {app.url && (
              <Button asChild>
                <a href={app.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span>Visit App</span>
                </a>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
