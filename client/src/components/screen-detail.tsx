import React, { useState } from 'react';
import { Screen, App } from '@shared/schema';
import { CloudinaryImage } from './ui/cloudinary-image';

interface ScreenDetailProps {
  screen: Screen & { app?: App };
  isPriority?: boolean;
}

/**
 * ScreenDetail component that displays a full screen image with details
 * Utilizes Cloudinary URLs when available
 */
export function ScreenDetail({ screen, isPriority = false }: ScreenDetailProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const appName = screen.app?.name || 'App';

  // Format the image description for better readability
  const formatDescription = (description: string | null) => {
    if (!description) return '';
    // Split by newlines or periods and join with proper spacing
    return description
      .split(/\n|\. /)
      .filter(Boolean)
      .map(s => s.trim())
      .join('. ');
  };

  return (
    <div className="flex flex-col space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{screen.name}</h2>
      
      <div className="relative rounded-lg overflow-hidden border">
        <CloudinaryImage
          src={screen.imageUrl}
          cloudinarySrc={screen.cloudinaryUrl || undefined}
          alt={screen.altText || `Screen from ${appName}`}
          className="w-full h-auto max-h-[80vh] object-contain bg-gray-50"
          priority={isPriority}
          onLoad={() => setIsImageLoaded(true)}
        />
      </div>
      
      {screen.description && (
        <p className="text-sm text-gray-600 mt-2">
          {formatDescription(screen.description)}
        </p>
      )}
      
      <div className="flex flex-wrap gap-2 mt-2">
        {screen.tags && screen.tags.map((tag, index) => (
          <span 
            key={`${tag}-${index}`}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {tag}
          </span>
        ))}
        
        {screen.flow && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {screen.flow}
          </span>
        )}
        
        {screen.category && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {screen.category}
          </span>
        )}
      </div>
      
      {screen.cloudinaryUrl && (
        <div className="text-xs text-green-600 mt-1">
          ✓ Optimized with Cloudinary
        </div>
      )}
    </div>
  );
}