import { useState } from "react";
import { Screen } from "@/types";
import { Maximize2 } from "lucide-react";

interface ScreenThumbnailProps {
  screen: Screen;
  onClick: (screen: Screen) => void;
}

export default function ScreenThumbnail({ screen, onClick }: ScreenThumbnailProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  return (
    <div className="cursor-pointer hover:opacity-90 transition-all" onClick={() => onClick(screen)}>
      <div className="bg-gray-100 rounded-lg overflow-hidden shadow-sm relative group" style={{ aspectRatio: "9/16" }}>
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
            <span className="sr-only">Loading...</span>
          </div>
        )}
        
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">
              {screen.name ? `${screen.name} image not available` : 'Image not available'}
            </span>
          </div>
        ) : (
          <img 
            src={screen.imageUrl} 
            alt={`${screen.name || 'Screen view'} - ${screen.description || 'Design interface example'}`}
            className={`w-full h-full object-contain ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            aria-label={`${screen.name || 'Screen view'} - ${screen.description || 'Design interface example'}`}
          />
        )}
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all">
            <button className="bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center">
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      {/* Image title removed */}
    </div>
  );
}
