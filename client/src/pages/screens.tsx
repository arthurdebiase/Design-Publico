import { useState, useEffect } from 'react';
import { Loader2, FileText, Maximize2, ChevronDown, Filter } from 'lucide-react';
import { Screen, App } from '@/types';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScreenModal } from '@/components/ui/screen-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

export default function ScreensPage() {
  const [allScreens, setAllScreens] = useState<Array<Screen & { app?: App }>>([]);
  const [filteredScreens, setFilteredScreens] = useState<Array<Screen & { app?: App }>>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [currentAppScreens, setCurrentAppScreens] = useState<Screen[]>([]);
  const [currentApp, setCurrentApp] = useState<App | null>(null);
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  // Filter screens when selectedAppId changes
  useEffect(() => {
    if (allScreens.length === 0) return;
    
    if (selectedAppId) {
      const filtered = allScreens.filter(screen => 
        screen.app?.id.toString() === selectedAppId
      );
      setFilteredScreens(filtered);
    } else {
      setFilteredScreens(allScreens);
    }
  }, [selectedAppId, allScreens]);

  useEffect(() => {
    const fetchAllScreens = async () => {
      setLoading(true);
      try {
        // Fetch all apps
        const appsResponse = await fetch('/api/apps');
        const fetchedApps = await appsResponse.json();
        
        if (!Array.isArray(fetchedApps)) {
          throw new Error('Invalid response format from API');
        }
        
        setApps(fetchedApps);
        
        // For each app, fetch its screens
        const fetchedScreens: Array<Screen & { app?: App }> = [];
        
        for (const app of fetchedApps) {
          const screensResponse = await fetch(`/api/apps/${app.id}/screens`);
          const appScreens = await screensResponse.json();
          
          if (Array.isArray(appScreens)) {
            // Add app information to each screen for display
            const screensWithAppInfo = appScreens.map(screen => ({
              ...screen,
              app: app
            }));
            
            fetchedScreens.push(...screensWithAppInfo);
          }
        }
        
        // Sort all screens alphabetically by screen name
        const sortedScreens = fetchedScreens.sort((a, b) => {
          // Ensure there's a name value to sort by
          const nameA = a.name?.toLowerCase() || '';
          const nameB = b.name?.toLowerCase() || '';
          return nameA.localeCompare(nameB);
        });
        
        setAllScreens(sortedScreens);
        setFilteredScreens(sortedScreens);
      } catch (err) {
        console.error('Error fetching screens:', err);
        setError('Failed to load screens. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllScreens();
  }, []);
  
  const handleOpenModal = (screen: Screen & { app?: App }) => {
    if (!screen.app) return;

    // Get all screens from the same app
    const appScreens = allScreens.filter((s: Screen & { app?: App }) => s.appId === screen.appId);
    
    // Find the index of the current screen
    const index = appScreens.findIndex((s: Screen & { app?: App }) => s.id === screen.id);
    
    setCurrentAppScreens(appScreens);
    setCurrentApp(screen.app);
    setCurrentScreenIndex(index >= 0 ? index : 0);
    setIsModalOpen(true);
  };
  
  const handleAppFilterChange = (appId: string | null) => {
    setSelectedAppId(appId);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 py-20">
        <Loader2 className="h-12 w-12 text-[#0066FF] animate-spin mb-4" />
        <p className="text-lg text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 py-20">
        <div className="p-6 bg-red-50 rounded-lg max-w-md">
          <h2 className="text-xl font-semibold text-red-700 mb-2">{t('common.error')}</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700"
          >
            {t('common.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 md:px-6 pt-10 pb-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t('screens.allScreens')}</h1>
        <p className="text-gray-600">
          {t('screens.browseAll', { count: filteredScreens.length })}
        </p>
      </div>
      
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {'Filter by App'}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Filter by App</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className={!selectedAppId ? "bg-accent/50" : ""}
                onClick={() => handleAppFilterChange(null)}
              >
                All Apps
              </DropdownMenuItem>
              {apps.map((app: App) => (
                <DropdownMenuItem
                  key={app.id}
                  className={selectedAppId === app.id.toString() ? "bg-accent/50" : ""}
                  onClick={() => handleAppFilterChange(app.id.toString())}
                >
                  <div className="flex items-center gap-2">
                    {app.logo ? (
                      <img src={app.logo} alt="App logo" className="w-6 h-6" />
                    ) : (
                      <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs">{app.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {selectedAppId && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleAppFilterChange(null)}
              className="text-sm"
            >
              Clear filter
            </Button>
          )}
        </div>
      </div>
      
      {filteredScreens.length > 0 ? (
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          role="grid"
          aria-label={t('screens.allScreens')}
        >
          {filteredScreens.map((screen: Screen & { app?: App }) => (
            <div key={screen.id} role="gridcell">
              <ScreenThumbnail 
                screen={screen} 
                onClick={handleOpenModal}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('screens.noScreens')}</h3>
          <p className="text-gray-500 mt-2">
            {t('screens.noScreensDescription')}
          </p>
        </div>
      )}
      
      {currentApp && currentAppScreens.length > 0 && (
        <ScreenModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          screens={currentAppScreens}
          currentScreenIndex={currentScreenIndex}
          onScreenChange={setCurrentScreenIndex}
          app={currentApp}
        />
      )}
    </div>
  );
}

interface ScreenThumbnailProps {
  screen: Screen & { app?: App };
  onClick: (screen: Screen & { app?: App }) => void;
}

function ScreenThumbnail({ screen, onClick }: ScreenThumbnailProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isMobile = useIsMobile();
  
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  return (
    <div 
      className="cursor-pointer hover:opacity-90 transition-all" 
      onClick={() => onClick(screen)}
      role="button"
      tabIndex={0}
      aria-label={`View ${screen.app?.name ? screen.app.name + ': ' : ''}${screen.name} screen details`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(screen);
        }
      }}
    >
      <div className="bg-gray-100 rounded-lg overflow-hidden shadow-sm relative group" style={{ aspectRatio: "9/16" }}>
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
            <span className="sr-only">Loading screen image for {screen.name}</span>
          </div>
        )}
        
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <span className="text-gray-400" aria-hidden="true">
              {screen.name ? `${screen.name} image not available` : 'Image not available'}
            </span>
            <span className="sr-only">
              Screen image for {screen.app?.name ? screen.app.name + ': ' : ''}{screen.name} is not available
            </span>
          </div>
        ) : (
          <img 
            src={screen.imageUrl} 
            alt={`${screen.app?.name ? screen.app.name + ': ' : ''}${screen.name} - ${screen.description || 'Screen view'}`}
            className={`w-full h-full object-contain ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all">
            <button 
              className="bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center"
              aria-label="View fullscreen"
              tabIndex={-1} 
            >
              <Maximize2 className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        {screen.app && (
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
            {screen.app.logo ? (
              <img 
                src={screen.app.logo} 
                alt="App Logo" 
                className="w-6 h-6"
              />
            ) : (
              <div className="w-6 h-6 rounded-sm bg-gray-100 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">{screen.app.name.charAt(0)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}