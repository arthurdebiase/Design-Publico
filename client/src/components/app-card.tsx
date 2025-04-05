import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { App, Screen } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { fetchScreensByAppId } from "@/lib/airtable";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";

interface AppCardProps {
  app: App;
}

function AppScreenCarousel({ appId }: { appId: string }) {
  const { data: screens, isLoading, error } = useQuery({
    queryKey: [`/api/apps/${appId}/screens`],
    queryFn: () => fetchScreensByAppId(appId),
  });
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [touchMoved, setTouchMoved] = useState(false);

  useEffect(() => {
    if (!api) return;
    
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

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

  // Get first 3 screens
  const displayScreens = screens.slice(0, Math.min(3, screens.length));

  // Prevent click events from bubbling up (for navigation buttons)
  const handleControlClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle click on the carousel to navigate to app detail
  const handleCarouselClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!touchMoved) {
      navigate(`/app/${appId}`);
    }
    // Reset the flag
    setTouchMoved(false);
  };
  
  // Track touch movements to prevent navigating when user is swiping
  const handleTouchStart = () => {
    setTouchMoved(false);
  };
  
  const handleTouchMove = () => {
    setTouchMoved(true);
  };

  return (
    <Carousel 
      className="w-full h-full relative group cursor-pointer touch-pan-y" 
      opts={{ 
        loop: true,
        align: "center"
      }} 
      setApi={setApi}
      onClick={handleCarouselClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <CarouselContent className="-ml-1 h-full">
        {displayScreens.map((screen) => (
          <CarouselItem key={screen.id} className="pl-1 h-full">
            <div className="w-full h-full flex items-center justify-center bg-gray-100 p-2">
              <div className="flex items-center justify-center h-full relative group/item" style={{ 
                width: isMobile ? "95%" : "90%"
              }}>
                <img 
                  src={screen.imageUrl} 
                  alt={screen.name}
                  className="h-full w-auto object-contain rounded-lg shadow-sm transition-transform hover:scale-[1.01]"
                  style={{ 
                    maxWidth: "100%",
                    objectFit: "contain",
                    objectPosition: "center"
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/app/${appId}`);
                  }}
                />
                
                {/* Clickable overlay for desktop */}
                {!isMobile && (
                  <div 
                    className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all opacity-0 group-hover/item:opacity-100 flex items-center justify-center rounded-lg cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/app/${appId}`);
                    }}
                  >
                    <div className="bg-black/60 text-white rounded-full p-2 transform scale-90 hover:scale-100 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline>
                        <line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div 
        className={`absolute inset-0 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
        onClick={handleControlClick}
      >
        <CarouselPrevious 
          className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${isMobile ? 'h-7 w-7' : 'h-8 w-8'} bg-black/40 hover:bg-black/60 border-none text-white z-10 shadow-sm`}
          variant="outline"
        />
        <CarouselNext 
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${isMobile ? 'h-7 w-7' : 'h-8 w-8'} bg-black/40 hover:bg-black/60 border-none text-white z-10 shadow-sm`}
          variant="outline"
        />
      </div>
      
      {/* Dots indicator */}
      {displayScreens.length > 1 && (
        <div 
          className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10"
          onClick={handleControlClick}
        >
          {displayScreens.map((_, index) => (
            <button
              key={index}
              className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full transition-colors ${
                index === current ? "bg-black/70" : "bg-black/30"
              }`}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </Carousel>
  );
}

export default function AppCard({ app }: AppCardProps) {
  const isMobile = useIsMobile();
  
  // Responsive heights for different screen sizes
  const cardHeight = isMobile ? "h-[400px]" : "h-[600px]";
  const imageContainerHeight = isMobile ? "h-[340px]" : "h-[540px]";
  
  return (
    <Link href={`/app/${app.id}`}>
      <div className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer mb-6 flex flex-col ${cardHeight}`}>
        <div className="relative flex-grow overflow-hidden" style={{ height: imageContainerHeight }}>
          <AppScreenCarousel appId={app.id.toString()} />
        </div>
        <div className={`${isMobile ? 'p-3' : 'p-4'} flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`${isMobile ? 'w-9 h-9' : 'w-10 h-10'} flex-shrink-0 rounded-lg border border-gray-200 flex items-center justify-center p-0`}>
              {app.logo ? (
                <img 
                  src={app.logo} 
                  alt={`${app.name} Logo`} 
                  className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`}
                />
              ) : (
                <LogoPlaceholder app={app} />
              )}
            </div>
            <div>
              <h3 className="font-medium text-[#333333]">{app.name}</h3>
              <p className="text-sm text-gray-500">{app.type}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${iconSize} text-gray-600`}>
            <path d="M2 20h20"></path>
            <path d="M12 4L2 9h20L12 4z"></path>
            <path d="M12 4v16"></path>
            <path d="M8 9v11"></path>
            <path d="M16 9v11"></path>
          </svg>
        );
      case 'Municipal':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${iconSize} text-gray-600`}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        );
      case 'State':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${iconSize} text-gray-600`}>
            <path d="M21.5 12H16c-.7 2-2 3-4 3s-3.3-1-4-3H2.5"></path>
            <path d="M5.5 5.1L2 12v6c0 1.1.9 2 2 2h16a2 2 0 002-2v-6l-3.4-6.9A2 2 0 0016.8 4H7.2a2 2 0 00-1.8 1.1z"></path>
          </svg>
        );
      default:
        return (
          <div className="text-gray-600 font-bold">{app.name.charAt(0)}</div>
        );
    }
  };
  
  return getIconByType();
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
