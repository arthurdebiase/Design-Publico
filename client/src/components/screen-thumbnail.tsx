import { Screen } from "@/types";
import { Maximize2 } from "lucide-react";
import { ResponsiveImage } from "@/components/ui/responsive-image";

interface ScreenThumbnailProps {
  screen: Screen;
  onClick: (screen: Screen) => void;
}

export default function ScreenThumbnail({ screen, onClick }: ScreenThumbnailProps) {
  
  return (
    <div className="cursor-pointer hover:opacity-90 transition-all" onClick={() => onClick(screen)}>
      <div className="bg-gray-100 rounded-lg overflow-hidden shadow-sm relative group" style={{ aspectRatio: "9/16" }}>
        <ResponsiveImage 
          src={screen.imageUrl}
          alt={screen.altText || `${screen.name || 'Screen view'} - ${screen.description || 'Design interface example'}`}
          aria-label={screen.altText || `${screen.name || 'Screen view'} - ${screen.description || 'Design interface example'}`}
          className="w-full h-full object-contain"
          placeholderClassName="absolute inset-0 flex items-center justify-center"
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
          widths={[300, 600, 900]}
          format="webp"
          quality={80}
          style={{ aspectRatio: "9/16" }}
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
