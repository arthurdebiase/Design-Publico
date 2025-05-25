import React from "react";
import { useLocation } from "wouter";
import { App } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { fetchScreensByAppId } from "@/lib/airtable";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { createSlug } from "@/lib/slugUtils";
import { useTranslation } from 'react-i18next';
import { Calendar, Clock } from "lucide-react";

interface AppCardProps {
  app: App;
  isPriority?: boolean;
  isPlanned?: boolean;
}

function AppScreenImage({ appId, appName, isPriority = false, isPlanned = false }: { appId: string, appName?: string, isPriority?: boolean, isPlanned?: boolean }) {
  const { data: screens, isLoading, error } = useQuery({
    queryKey: [`/api/apps/${appId}/screens`],
    queryFn: () => fetchScreensByAppId(appId),
  });
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  // Check if it's explicitly a planned app
  if (isPlanned) {
    return (
      <div className="w-full h-full bg-amber-50 flex flex-col items-center justify-center p-4">
        <Calendar className="w-8 h-8 text-amber-500 mb-2" />
        <p className="text-amber-800 text-sm font-medium text-center">Em breve</p>
        <p className="text-amber-700 text-xs text-center mt-1">Aplicativo planejado</p>
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (error || !screens || screens.length === 0) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-sm">No screens available</p>
      </div>
    );
  }

  // Get first screen only
  const firstScreen = screens[0];

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 p-4">
      <div className="flex items-center justify-center h-full relative group/item" style={{ 
        width: "calc(100% - 16px)",
        height: "calc(100% - 16px)"
      }}>
        <div 
          className="h-full w-full flex items-center justify-center cursor-pointer"
          onClick={() => navigate(`/app/${appId}`)}
          role="button"
          tabIndex={0}
          aria-label={`View ${appName || 'app'} details`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              navigate(`/app/${appId}`);
            }
          }}
        >
          <ResponsiveImage 
            src={firstScreen.imageUrl}
            cloudinarySrc={firstScreen.cloudinaryUrl} // Use Cloudinary URL when available for reliable hosting
            alt={`${appName ? appName + ': ' : ''}${firstScreen.name || 'Screen view'} - ${firstScreen.description || 'User interface example'}`}
            className="w-full h-full object-contain transition-transform hover:scale-[1.01]"
            style={{ 
              objectFit: "contain",
              objectPosition: "center"
            }}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            widths={[320, 480, 640]}
            format="webp"
            quality={85}
            priority={isPriority}
            placeholder={
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="sr-only">Loading image for {appName || 'app'}</span>
              </div>
            }
            placeholderClassName="w-full h-full flex items-center justify-center bg-gray-100"
          />
        </div>
        
        {/* No hover overlay for a cleaner look */}
      </div>
    </div>
  );
}

export default function AppCard({ app, isPriority = false, isPlanned = false }: AppCardProps) {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  
  // Check if app is planned (either via prop or app status)
  const appIsPlanned = isPlanned || app.status === "Planejado";
  
  // Responsive heights that maintain a compact aspect ratio with larger image size
  const cardHeight = isMobile ? "h-auto" : "h-auto";
  // Use aspect ratio to maintain proper proportions with better size
  const imageContainerStyle = { aspectRatio: "9/14" };
  
  // Add badge class for planned apps
  const cardClass = appIsPlanned 
    ? "bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer mb-4 flex flex-col border border-amber-200"
    : "bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer mb-4 flex flex-col";
  
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const appSlug = createSlug(app.name);
    navigate(`/app/${appSlug}`);
  };
  
  return (
    <div 
      onClick={handleCardClick}
      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-lg cursor-pointer"
      role="link"
      tabIndex={0}
      aria-label={`View details for ${app.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/app/${app.id}`);
        }
      }}
    >
      <div 
        className={`${cardClass} ${cardHeight}`}
        role="article"
        aria-labelledby={`app-name-${app.id}`}
      >
        <div className="relative flex-grow overflow-hidden" style={imageContainerStyle}>
          <AppScreenImage 
            appId={app.id.toString()} 
            appName={app.name} 
            isPriority={isPriority} 
            isPlanned={appIsPlanned} 
          />
          {appIsPlanned && (
            <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-xs px-2 py-1 m-2 rounded-full">
              Em breve
            </div>
          )}
        </div>
        <div className={`${isMobile ? 'p-2' : 'p-3'} flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`${isMobile ? 'w-8 h-8' : 'w-9 h-9'} flex-shrink-0 flex items-center justify-center`}>
              {app.logo ? (
                <div className="w-full h-full flex items-center justify-center">
                  <ResponsiveImage 
                    src={app.logo} 
                    cloudinarySrc={app.cloudinaryLogo}
                    alt={`${app.name} Logo`} 
                    className={`w-full h-full object-contain`}
                    widths={[32, 64, 96]}
                    quality={90}
                    format="webp"
                    style={{ objectFit: "contain" }}
                    placeholder={<LogoPlaceholder app={app} />}
                  />
                </div>
              ) : (
                <LogoPlaceholder app={app} />
              )}
            </div>
            <div className="text-sm overflow-hidden">
              <h3 id={`app-name-${app.id}`} className="font-medium truncate" title={app.name}>
                {app.name.length > 20 ? `${app.name.substring(0, 20)}...` : app.name}
              </h3>
              <p className="text-xs text-gray-500 truncate flex items-center">
                {app.country || "Brasil"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function truncateDescription(description: string, maxLength: number = 80): string {
  if (description.length <= maxLength) return description;
  return description.slice(0, maxLength) + '...';
}

function LogoPlaceholder({ app }: { app: App }) {
  const isMobile = useIsMobile();
  const size = isMobile ? 'w-8 h-8' : 'w-9 h-9';
  
  // Simple gray placeholder square with 1:1 aspect ratio
  return (
    <div 
      role="img" 
      aria-label={`${app.name} logo placeholder`}
      className={`${size} bg-gray-200 rounded-sm flex items-center justify-center`}
      style={{ aspectRatio: '1/1' }}
    >
      <span className="sr-only">Loading logo for {app.name}</span>
    </div>
  );
}

function getBadgeColorClass(type: string): string {
  switch (type) {
    case 'Federal':
      return 'bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded';
    case 'Municipal':
      return 'bg-teal-100 text-teal-800 text-xs font-medium px-2 py-1 rounded';
    case 'State':
      return 'bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded';
    default:
      return 'bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded';
  }
}

function getLogoBackgroundClass(type: string): string {
  switch (type) {
    case 'Federal':
      return 'bg-blue-500';
    case 'Municipal':
      return 'bg-teal-500';
    case 'State':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
}

function getPlatformBadgeClass(platform: string): string {
  switch (platform) {
    case 'iOS':
      return 'bg-blue-50 text-blue-600';
    case 'Android':
      return 'bg-green-50 text-green-600';
    case 'Web':
      return 'bg-orange-50 text-orange-600';
    case 'Cross-platform':
      return 'bg-purple-50 text-purple-600';
    default:
      return 'bg-gray-50 text-gray-600';
  }
}