import { Screen, App } from "@/types";
import { Maximize2 } from "lucide-react";
import { ResponsiveImage } from "@/components/ui/responsive-image";

interface ScreenThumbnailProps {
  screen: Screen & { app?: App };
  onClick: (screen: Screen & { app?: App }) => void;
  isPriority?: boolean; // Adicionado para priorizar carregamento de imagens LCP
  index?: number; // Para rastrear posição do item na grade
}

export default function ScreenThumbnail({ screen, onClick, isPriority = false, index = -1 }: ScreenThumbnailProps) {
  const handleClick = () => onClick(screen);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Dimensões fixas para evitar layout shift (CLS)
  // Imagens de aplicativo normalmente têm proporção 9:16
  const imageWidth = 300; 
  const imageHeight = 534; // Mantendo a proporção 9:16
  
  // Verifica se essa imagem é visível inicialmente (primeiras 10 imagens)
  // Isso otimiza o LCP (Largest Contentful Paint)
  const isAboveFold = isPriority || index < 10;
  
  return (
    <div 
      className="cursor-pointer hover:opacity-90 transition-all" 
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes de ${screen.name || 'tela'}`}
    >
      <div 
        className="bg-white rounded-lg overflow-hidden relative group border border-gray-200" 
        style={{ aspectRatio: "9/16", width: '100%', height: 'auto' }}
      >
        <ResponsiveImage 
          src={screen.imageUrl}
          cloudinarySrc={screen.cloudinaryUrl} // Use Cloudinary URL when available for reliable hosting
          alt={screen.altText || `${screen.name || 'Screen view'} - ${screen.description || 'Design interface example'}`}
          aria-label={screen.altText || `${screen.name || 'Screen view'} - ${screen.description || 'Design interface example'}`}
          className="w-full h-full object-cover"
          placeholderClassName="absolute inset-0 flex items-center justify-center"
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
          widths={[240, 320, 480]} // Reduzido o tamanho das imagens carregadas
          format="webp"
          quality={75} // Redução na qualidade para economizar bytes
          width={imageWidth}
          height={imageHeight}
          priority={isAboveFold} // Carrega imediatamente as imagens acima da dobra
          loading={isAboveFold ? "eager" : "lazy"}
        />
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all">
            <button 
              className="bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center"
              aria-label={`Ver tela em tela cheia: ${screen.name || 'Tela de aplicativo'}`}
              title={`Ampliar ${screen.name || 'tela'}`}
            >
              <Maximize2 className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
