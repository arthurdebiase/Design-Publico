import React from "react";
import { useLocation } from "wouter";
import { App } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { fetchScreensByAppId } from "@/lib/airtable";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { createSlug } from "@/lib/slugUtils";

interface AppCardProps {
  app: App;
  isPriority?: boolean;
}

function AppScreenImage({ appId, appName, isPriority = false }: { appId: string, appName?: string, isPriority?: boolean }) {
  const { data: screens, isLoading, error } = useQuery({
    queryKey: [`/api/apps/${appId}/screens`],
    queryFn: () => fetchScreensByAppId(appId),
  });
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();

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
            alt={`${appName ? appName + ': ' : ''}${firstScreen.name || 'Screen view'} - ${firstScreen.description || 'User interface example'}`}
            className="w-full h-full object-contain transition-transform hover:scale-[1.01]"
            style={{ 
              objectFit: "contain",
              objectPosition: "center",
              aspectRatio: "9/16"
            }}
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 25vw, 33vw"
            widths={[250, 350, 480]}
            format="webp"
            quality={80}
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

export default function AppCard({ app, isPriority = false }: AppCardProps) {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  
  // Responsive heights that maintain the proper aspect ratio (9:16)
  const cardHeight = isMobile ? "h-auto" : "h-auto";
  // Use aspect ratio to maintain proper proportions
  const imageContainerStyle = { aspectRatio: "9/18" };
  
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
        className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer mb-4 flex flex-col ${cardHeight}`}
        role="article"
        aria-labelledby={`app-name-${app.id}`}
      >
        <div className="relative flex-grow overflow-hidden" style={imageContainerStyle}>
          <AppScreenImage appId={app.id.toString()} appName={app.name} isPriority={isPriority} />
        </div>
        <div className={`${isMobile ? 'p-2' : 'p-3'} flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`${isMobile ? 'w-8 h-8' : 'w-9 h-9'} flex-shrink-0 flex items-center justify-center`}>
              {app.logo ? (
                <ResponsiveImage 
                  src={app.logo} 
                  alt={`${app.name} Logo`} 
                  className={`${isMobile ? 'w-8 h-8' : 'w-9 h-9'} object-contain`}
                  widths={[32, 64, 96]}
                  quality={90}
                  placeholder={<LogoPlaceholder app={app} />}
                />
              ) : (
                <LogoPlaceholder app={app} />
              )}
            </div>
            <div className="text-sm">
              <h3 id={`app-name-${app.id}`} className="font-medium">{app.name}</h3>
              <p className="text-xs text-gray-500">{app.type}</p>
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
  const iconSize = isMobile ? "h-4 w-4" : "h-5 w-5";
  
  const getIconByType = () => {
    switch (app.type) {
      case 'Federal':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={`${iconSize} text-gray-600`}
            aria-hidden="true"
            role="img"
            aria-label={`Federal government icon for ${app.name}`}
          >
            <path d="M2 20h20"></path>
            <path d="M12 4L2 9h20L12 4z"></path>
            <path d="M12 4v16"></path>
            <path d="M8 9v11"></path>
            <path d="M16 9v11"></path>
          </svg>
        );
      case 'Municipal':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={`${iconSize} text-gray-600`}
            aria-hidden="true"
            role="img"
            aria-label={`Municipal government icon for ${app.name}`}
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        );
      case 'State':
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={`${iconSize} text-gray-600`}
            aria-hidden="true"
            role="img"
            aria-label={`State government icon for ${app.name}`}
          >
            <path d="M21.5 12H16c-.7 2-2 3-4 3s-3.3-1-4-3H2.5"></path>
            <path d="M5.5 5.1L2 12v6c0 1.1.9 2 2 2h16a2 2 0 002-2v-6l-3.4-6.9A2 2 0 0016.8 4H7.2a2 2 0 00-1.8 1.1z"></path>
          </svg>
        );
      default:
        return (
          <div 
            className="text-gray-600 font-bold"
            aria-hidden="true"
          >
            {app.name.charAt(0)}
          </div>
        );
    }
  };
  
  return (
    <div role="img" aria-label={`${app.name} logo placeholder`}>
      {getIconByType()}
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