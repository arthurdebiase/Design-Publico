import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { App, Screen } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { fetchScreensByAppId } from "@/lib/airtable";
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

  return (
    <Carousel 
      className="w-full h-full relative group" 
      opts={{ loop: true }} 
      setApi={setApi}
    >
      <CarouselContent className="-ml-1 h-full">
        {displayScreens.map((screen) => (
          <CarouselItem key={screen.id} className="pl-1 h-full">
            <div className="w-full h-full flex items-center justify-center bg-gray-100 p-1">
              <div className="h-full flex items-center justify-center overflow-hidden">
                <img 
                  src={screen.imageUrl} 
                  alt={screen.name}
                  className="h-full max-w-full object-contain"
                />
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleControlClick}
      >
        <CarouselPrevious 
          className="absolute left-2 top-1/2 transform -translate-y-1/2 h-7 w-7 bg-black/25 hover:bg-black/50 border-none text-white z-10" 
          variant="outline"
        />
        <CarouselNext 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 bg-black/25 hover:bg-black/50 border-none text-white z-10" 
          variant="outline"
        />
      </div>
      
      {/* Dots indicator */}
      {displayScreens.length > 1 && (
        <div 
          className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10"
          onClick={handleControlClick}
        >
          {displayScreens.map((_, index) => (
            <button
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === current ? "bg-white" : "bg-white/50"
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
  return (
    <Link href={`/app/${app.id}`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer mb-6 h-[600px] flex flex-col">
        <div className="relative flex-grow overflow-hidden">
          <AppScreenCarousel appId={app.id.toString()} />
        </div>
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 flex-shrink-0 rounded-lg border border-gray-200 flex items-center justify-center p-0">
              {app.logo ? (
                <img 
                  src={app.logo} 
                  alt={`${app.name} Logo`} 
                  className="w-8 h-8"
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
          <p className="text-sm text-gray-600 mt-2">
            {truncateDescription(app.description)}
          </p>
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
  const getIconByType = () => {
    switch (app.type) {
      case 'Federal':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-600">
            <path d="M2 20h20"></path>
            <path d="M12 4L2 9h20L12 4z"></path>
            <path d="M12 4v16"></path>
            <path d="M8 9v11"></path>
            <path d="M16 9v11"></path>
          </svg>
        );
      case 'Municipal':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-600">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        );
      case 'State':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-600">
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
