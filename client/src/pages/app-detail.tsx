import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchAppById, fetchScreensByAppId } from "@/lib/airtable";
import { ScreenModal } from "@/components/ui/screen-modal";
import ScreenThumbnail from "@/components/screen-thumbnail";
import { Screen } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink, Bookmark, 
         Apple, TabletSmartphone, Globe, Tag, 
         FileText, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

// Platform badge styling function
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

export default function AppDetail() {
  const [match, params] = useRoute("/app/:id");
  const appId = params?.id || "";
  const { t } = useTranslation();
  const [location] = useLocation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  
  // Extract screenId from URL query parameters
  const getScreenIdFromUrl = (): string | null => {
    const url = new URL(window.location.href);
    return url.searchParams.get('screen');
  };
  
  const { 
    isLoading: isAppLoading, 
    error: appError, 
    data: app 
  } = useQuery({
    queryKey: [`/api/apps/${appId}`],
    queryFn: () => fetchAppById(appId),
    enabled: !!appId
  });
  
  const { 
    isLoading: isScreensLoading, 
    error: screensError, 
    data: screens 
  } = useQuery({
    queryKey: [`/api/apps/${appId}/screens`],
    queryFn: () => fetchScreensByAppId(appId),
    enabled: !!appId
  });
  
  const isLoading = isAppLoading || isScreensLoading;
  const error = appError || screensError;
  
  const handleOpenModal = (screen: Screen) => {
    const index = screens?.findIndex(s => s.id === screen.id) || 0;
    setCurrentScreenIndex(index);
    setIsModalOpen(true);
    
    // Update URL with screen ID
    const url = new URL(window.location.href);
    url.searchParams.set('screen', screen.id);
    window.history.replaceState({}, '', url.toString());
  };
  
  // Check for screen ID in URL and open modal if found
  useEffect(() => {
    if (screens && screens.length > 0) {
      const screenId = getScreenIdFromUrl();
      if (screenId) {
        const screenIndex = screens.findIndex(s => s.id === screenId);
        if (screenIndex !== -1) {
          // Open modal with the specified screen
          setCurrentScreenIndex(screenIndex);
          setIsModalOpen(true);
        }
      }
    }
  }, [screens]);
  
  if (!match) return null;
  
  return (
    <div className="container mx-auto px-4 md:px-6 pt-6 pb-0">
      {isLoading ? (
        <AppDetailSkeleton />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          Error: {(error as Error).message}
        </div>
      ) : app ? (
        <>
          <div className="bg-white rounded-lg overflow-hidden shadow-md mb-8">
            <div className="bg-white p-6 relative">
              <div className="flex flex-row items-center">
                <div className="flex-shrink-0 mr-6">
                  <div className="w-20 h-20 flex items-center justify-center bg-white">
                    {app.logo ? (
                      <img src={app.logo} alt={`${app.name} logo`} className="w-20 h-20" />
                    ) : (
                      <AppIconPlaceholder app={app} />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center mb-2 gap-3">
                    {/* Display app name instead of platform */}
                    <h1 className="text-xl font-bold">{app.name}</h1>
                  </div>
                  
                  {/* Add type below app name */}
                  {app.type && (
                    <p className="text-gray-500 mb-3">
                      {app.type}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-3">
                    {app.language && (
                      <Badge variant="secondary" className="px-3 py-1.5 rounded flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>{app.language}</span>
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 mt-4 md:mt-0">
                  {app.url && (
                    <Button asChild className="bg-[#0066FF] hover:bg-blue-700">
                      <a href={app.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        <span>Visit</span>
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 pt-0">
              {screens && (
                <div className="flex items-center mb-4">
                  <Badge variant="outline" className="px-2 py-1 flex items-center">
                    <Smartphone className="h-4 w-4 mr-1" />
                    <span>{screens.length} {t('screens.title')}</span>
                  </Badge>
                </div>
              )}
              
              {isScreensLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="w-full aspect-[9/16] rounded-lg" />
                      <div className="mt-2">
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : screens && screens.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {screens.map((screen) => (
                    <ScreenThumbnail 
                      key={screen.id} 
                      screen={screen} 
                      onClick={handleOpenModal} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No screens available</h3>
                  <p className="text-gray-500 mt-2">
                    This app doesn't have any screens available yet.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {screens && screens.length > 0 && (
            <ScreenModal
              isOpen={isModalOpen}
              onClose={() => {
                // Close modal and update URL to remove screen parameter
                setIsModalOpen(false);
                const url = new URL(window.location.href);
                url.searchParams.delete('screen');
                window.history.replaceState({}, '', url.toString());
              }}
              screens={screens}
              currentScreenIndex={currentScreenIndex}
              onScreenChange={(index) => {
                // Update URL when screen changes
                setCurrentScreenIndex(index);
                const url = new URL(window.location.href);
                url.searchParams.set('screen', screens[index].id);
                window.history.replaceState({}, '', url.toString());
              }}
              app={app}
            />
          )}
        </>
      ) : (
        <div className="bg-white p-8 rounded-lg text-center">
          <h3 className="font-medium text-lg mb-2">Application not found</h3>
          <p className="text-gray-500 mb-4">The application you're looking for might have been removed or doesn't exist.</p>
          <Button asChild>
            <Link href="/">Go back to gallery</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function AppDetailSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md mb-8">
      <div className="bg-white p-6 relative">
        <div className="flex items-start">
          <Skeleton className="w-16 h-16 rounded-2xl mr-6" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <div className="flex gap-3 mt-4">
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-2">
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
          <div className="absolute top-6 right-6">
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <Skeleton className="h-6 w-24 mb-4 rounded-md" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i}>
              <Skeleton className="w-full aspect-[9/16] rounded-lg" />
              <div className="mt-2">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppIconPlaceholder({ app }: { app: any }) {
  const getIconByCategory = () => {
    switch (app.category) {
      case 'Healthcare':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
            <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
          </svg>
        );
      case 'Finance':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
        );
      case 'Government':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
            <path d="M2 20h20"></path>
            <path d="M12 4L2 9h20L12 4z"></path>
            <path d="M12 4v16"></path>
            <path d="M8 9v11"></path>
            <path d="M16 9v11"></path>
          </svg>
        );
      default:
        return (
          <div className="text-[#0066FF] text-xl font-bold">{app.name.charAt(0)}</div>
        );
    }
  };
  
  return getIconByCategory();
}

function getPlatformIcon(platform: string) {
  switch (platform) {
    case 'iOS':
      return <Apple className="h-4 w-4" />;
    case 'TabletSmartphone':
      return <TabletSmartphone className="h-4 w-4" />;
    case 'Web':
      return <Globe className="h-4 w-4" />;
    default:
      return <Smartphone className="h-4 w-4" />;
  }
}
