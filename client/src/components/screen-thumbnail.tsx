import { Screen } from "@/types";
import { Maximize2 } from "lucide-react";
import LazyImage from "@/lib/LazyImage";

interface ScreenThumbnailProps {
  screen: Screen;
  onClick: (screen: Screen) => void;
}

export default function ScreenThumbnail({ screen, onClick }: ScreenThumbnailProps) {
  const altText = `${screen.name || 'Screen view'} - ${screen.description || 'Design interface example'}`;
  
  // Create error placeholder specific to this screen
  const errorPlaceholder = (
    <span className="text-gray-400">
      {screen.name ? `${screen.name} image not available` : 'Image not available'}
    </span>
  );
  
  return (
    <div className="cursor-pointer hover:opacity-90 transition-all" onClick={() => onClick(screen)}>
      <div className="bg-gray-100 rounded-lg overflow-hidden shadow-sm relative group" style={{ aspectRatio: "9/16" }}>
        <LazyImage 
          src={screen.imageUrl} 
          alt={altText}
          className="w-full h-full object-contain"
          quality={85} // Good balance between quality and file size
          errorPlaceholder={errorPlaceholder}
          aria-label={altText}
          // Use appropriate width based on thumbnail size in grid
          width={250} // Set the appropriate width for your thumbnails
        />
        
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
