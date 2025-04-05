import { useState } from "react";
import { useRoute, Link } from "wouter";
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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  
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
  };
  
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
            <div className="bg-gray-800 text-white p-6">
              <div className="flex flex-col md:flex-row md:items-start">
                <div className="flex-shrink-0 mr-6 mb-4 md:mb-0">
                  <div className="w-20 h-20 rounded-2xl border border-gray-700 flex items-center justify-center bg-white">
                    {app.logo ? (
                      <img src={app.logo} alt={`${app.name} logo`} className="w-14 h-14" />
                    ) : (
                      <AppIconPlaceholder app={app} />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center mb-2 gap-3">
                    <h1 className="text-2xl font-bold">{app.name}</h1>
                    {app.type && (
                      <Badge className="bg-blue-200 text-blue-800 border-0">
                        {app.type}
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-300 mb-4">
                    {app.type}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="secondary" className={`px-3 py-1.5 rounded flex items-center gap-2 ${getPlatformBadgeClass(app.platform)}`}>
                      {getPlatformIcon(app.platform)}
                      <span>{app.platform}</span>
                    </Badge>
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
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-semibold">App Screens</h2>
                {screens && (
                  <Badge variant="outline" className="ml-3 px-2 py-1 flex items-center">
                    <Smartphone className="h-4 w-4 mr-1" />
                    <span>{screens.length} screens</span>
                  </Badge>
                )}
              </div>
              
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
              onClose={() => setIsModalOpen(false)}
              screens={screens}
              currentScreenIndex={currentScreenIndex}
              onScreenChange={setCurrentScreenIndex}
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
      <div className="bg-gray-800 text-white p-6">
        <div className="flex items-start">
          <Skeleton className="w-16 h-16 rounded-2xl mr-6" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="flex gap-3">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
          <div className="flex-shrink-0 flex space-x-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <Skeleton className="h-8 w-36 mb-4" />
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-white">
            <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
          </svg>
        );
      case 'Finance':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-white">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
        );
      case 'Government':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-white">
            <path d="M2 20h20"></path>
            <path d="M12 4L2 9h20L12 4z"></path>
            <path d="M12 4v16"></path>
            <path d="M8 9v11"></path>
            <path d="M16 9v11"></path>
          </svg>
        );
      default:
        return (
          <div className="text-white text-xl font-bold">{app.name.charAt(0)}</div>
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
