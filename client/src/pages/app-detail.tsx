import { useState, useEffect, useMemo } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchAppById, fetchScreensByAppId } from "@/lib/airtable";
import { ScreenModal } from "@/components/ui/screen-modal";
import ScreenThumbnail from "@/components/screen-thumbnail";
import { App, Screen } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink, Bookmark, 
         Apple, TabletSmartphone, Globe, Tag, 
         FileText, Smartphone, ChevronDown, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [match, params] = useRoute("/app/:idOrSlug");
  const idOrSlug = params?.idOrSlug || "";
  const { t } = useTranslation();
  const [location] = useLocation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  // State for sections toggle
  const [showSections, setShowSections] = useState(false);
  // State for tag filtering
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
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
    queryKey: [`/api/apps/${idOrSlug}`],
    queryFn: () => fetchAppById(idOrSlug),
    enabled: !!idOrSlug
  });
  
  const { 
    isLoading: isScreensLoading, 
    error: screensError, 
    data: screens 
  } = useQuery({
    queryKey: [`/api/apps/${idOrSlug}/screens`],
    queryFn: () => fetchScreensByAppId(idOrSlug),
    enabled: !!idOrSlug
  });
  
  const isLoading = isAppLoading || isScreensLoading;
  const error = appError || screensError;
  
  // Extract all unique tags from screens
  const availableTags = useMemo(() => {
    if (!screens) return [];
    
    // Create a set of all unique tags
    const tagSet = new Set<string>();
    screens.forEach(screen => {
      if (screen.tags && Array.isArray(screen.tags)) {
        screen.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    // Convert the set to an array and sort alphabetically
    return Array.from(tagSet).sort();
  }, [screens]);

  // Filter screens based on selected tags
  const filteredScreens = useMemo(() => {
    if (!screens) return [];
    if (selectedTags.length === 0) return screens;
    
    return screens.filter(screen => {
      if (!screen.tags) return false;
      // Check if screen has any of the selected tags
      return selectedTags.some(tag => screen.tags?.includes(tag));
    });
  }, [screens, selectedTags]);
  
  // Function to handle adding/removing tag filters
  const handleTagFilterChange = (tag: string | null) => {
    if (tag === null) {
      // If null is passed, clear all filters
      setSelectedTags([]);
    } else if (selectedTags.includes(tag)) {
      // If tag is already selected, remove it
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      // Otherwise add the tag
      setSelectedTags(prev => [...prev, tag]);
    }
  };
  
  // Function to remove a specific tag from filters
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };
  
  // Function to group screens by their flow field while preserving Airtable order
  const getScreensBySection = () => {
    if (!filteredScreens) return {};
    
    // First, group screens by their flow
    const groupedScreens = filteredScreens.reduce((groups: Record<string, Screen[]>, screen) => {
      // Get the flow or set to "Other" if not available
      const flow = screen.flow || "Other";
      
      // Initialize the group if it doesn't exist
      if (!groups[flow]) {
        groups[flow] = [];
      }
      
      // Add the screen to its flow group
      groups[flow].push(screen);
      return groups;
    }, {});
    
    // Then, sort each group by screen order (which comes from Airtable)
    Object.keys(groupedScreens).forEach(flow => {
      groupedScreens[flow].sort((a, b) => a.order - b.order);
    });
    
    return groupedScreens;
  };
  
  const handleOpenModal = (screen: Screen) => {
    const index = screens?.findIndex(s => s.id === screen.id) || 0;
    setCurrentScreenIndex(index);
    setIsModalOpen(true);
    
    // Update URL with Airtable screen ID for better link sharing
    const url = new URL(window.location.href);
    url.searchParams.set('screen', screen.airtableId);
    window.history.replaceState({}, '', url.toString());
  };
  
  // Check for screen ID in URL and open modal if found
  useEffect(() => {
    if (screens && screens.length > 0) {
      const screenId = getScreenIdFromUrl();
      if (screenId) {
        // First try to find by airtableId
        let screenIndex = screens.findIndex(s => s.airtableId === screenId);
        
        // If not found by airtableId, try the regular id (for backward compatibility)
        if (screenIndex === -1) {
          screenIndex = screens.findIndex(s => String(s.id) === screenId);
        }
        
        if (screenIndex !== -1) {
          // Open modal with the specified screen
          setCurrentScreenIndex(screenIndex);
          setIsModalOpen(true);
        }
      }
    }
  }, [screens, location]);
  
  if (!match) return null;
  
  return (
    <div className="container mx-auto px-4 md:px-6 py-10">
      {isLoading ? (
        <AppDetailSkeleton />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          Error: {(error as Error).message}
        </div>
      ) : app ? (
        <>
          <div className="bg-white rounded-lg overflow-hidden mb-8">
            <div className="bg-white py-6 px-0 relative">
              <div className="flex flex-row items-center">
                <div className="flex-shrink-0 mr-6">
                  <div className="w-20 h-20 flex items-center justify-center bg-white">
                    {app.logo ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <ResponsiveImage 
                          src={app.logo} 
                          cloudinarySrc={app.cloudinaryLogo} 
                          alt={`${app.name} logo`} 
                          className="w-full h-full object-contain" 
                          widths={[80, 160]}
                          quality={90}
                          format="webp"
                          style={{ objectFit: "contain" }}
                          placeholder={<AppIconPlaceholder app={app} />}
                        />
                      </div>
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
            
            <div className="py-6 pt-0 px-0">
              {screens && (
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    {/* Component/Tag filter dropdown */}
                    <div className="flex items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-2"
                            aria-label={t('filters.filterByComponents')}
                            aria-haspopup="true"
                          >
                            {t('filters.components')}
                            <ChevronDown className="h-4 w-4 ml-2" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-auto">
                          <DropdownMenuLabel>{t('filters.components')}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className={selectedTags.length === 0 ? "bg-accent/50" : ""}
                            onClick={() => handleTagFilterChange(null)}
                          >
                            {t('filters.all')} {t('filters.components')}
                          </DropdownMenuItem>
                          {availableTags.map((tag: string, index: number) => (
                            <DropdownMenuItem
                              key={`tag-${index}-${tag}`}
                              className={selectedTags.includes(tag) ? "bg-accent/50" : ""}
                              onClick={() => handleTagFilterChange(tag)}
                            >
                              <span>{tag}</span>
                              {selectedTags.includes(tag) && <Check className="ml-auto h-4 w-4" />}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Sections toggle */}
                    <div className="flex items-center">
                      <label htmlFor="sections-toggle" className="text-sm mr-2 text-gray-600">{t('filters.sections')}</label>
                      <Switch
                        id="sections-toggle"
                        checked={showSections}
                        onCheckedChange={setShowSections}
                        className={showSections ? "bg-[#009440]" : ""}
                      />
                    </div>
                    
                    {/* Screen counter */}
                    <div className="text-gray-600 font-medium ml-auto">
                      {filteredScreens.length} {t('filters.screens')}
                    </div>
                  </div>
                  
                  {/* Active filter chips below filters */}
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {/* Component filter chips */}
                      {selectedTags.map(tag => (
                        <div 
                          key={`chip-tag-${tag}`}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-sm"
                        >
                          <span>{tag}</span>
                          <button 
                            onClick={() => handleRemoveTag(tag)}
                            className="rounded-full hover:bg-blue-200 p-1 transition-colors"
                            aria-label={`${t('filters.removeFilter')}: ${tag}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      
                      {/* Clear all filters button (shown only when multiple filters are active) */}
                      {selectedTags.length > 1 && (
                        <button
                          onClick={() => setSelectedTags([])}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-sm hover:bg-gray-200"
                          aria-label={t('filters.clearFilters')}
                        >
                          <span>{t('filters.clearFilters')}</span>
                          <X className="h-3 w-3 ml-1" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {isScreensLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-10">
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
                showSections ? (
                  // Display screens grouped by flow sections
                  <div className="pb-10">
                    {Object.entries(getScreensBySection())
                      .sort(([flowA], [flowB]) => {
                        // Put "Other" at the end
                        if (flowA === "Other") return 1;
                        if (flowB === "Other") return -1;
                        // Otherwise sort alphabetically
                        return flowA.localeCompare(flowB);
                      })
                      .map(([flow, flowScreens]) => (
                      <div key={flow} className="mb-8">
                        <h3 className="text-lg font-medium mb-4 text-gray-900 flex items-center">
                          {flow}
                          <span className="ml-2 text-sm text-gray-500">({flowScreens.length})</span>
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {flowScreens.map((screen) => (
                            <ScreenThumbnail 
                              key={screen.id} 
                              screen={screen} 
                              onClick={handleOpenModal} 
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Display all screens in a grid
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-10">
                    {filteredScreens.map((screen) => (
                      <ScreenThumbnail 
                        key={screen.id} 
                        screen={screen} 
                        onClick={handleOpenModal} 
                      />
                    ))}
                  </div>
                )
              ) : (
                // Enhanced empty state similar to the "Planejado" apps display
                <div className="text-center py-10 bg-white rounded-lg mb-10 border border-gray-100">
                  <div className="w-64 h-96 mx-auto mb-6 bg-gray-100 flex flex-col items-center justify-center p-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                      <p className="text-yellow-700 font-medium mb-1">{t('app.noScreens')}</p>
                      <p className="text-gray-600 text-sm">{t('app.noScreensDesc')}</p>
                    </div>
                  </div>
                  
                  {/* Status indicators for visibility */}
                  <div className="flex justify-center gap-2 mt-4">
                    {app.status === 'Planejado' && (
                      <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-sm font-medium text-yellow-700">
                        Planejado
                      </span>
                    )}
                    {app.status === 'Em Desenvolvimento' && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700">
                        Em Desenvolvimento
                      </span>
                    )}
                  </div>
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
                // Update URL when screen changes, using the Airtable ID for more stability
                setCurrentScreenIndex(index);
                const url = new URL(window.location.href);
                // Use Airtable ID instead of local DB ID for better link sharing
                url.searchParams.set('screen', screens[index].airtableId);
                window.history.replaceState({}, '', url.toString());
              }}
              app={app}
            />
          )}
        </>
      ) : (
        <div className="bg-white p-8 rounded-lg text-center">
          <h3 className="font-medium text-lg mb-2">{t('app.notFound')}</h3>
          <p className="text-gray-500 mb-4">{t('app.notFoundDesc')}</p>
          <Button asChild>
            <Link href="/">{t('app.goBack')}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function AppDetailSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden mb-8">
      <div className="bg-white py-6 px-0 relative">
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
      
      <div className="py-6 px-0">
        <Skeleton className="h-6 w-24 mb-4 rounded-md" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-10">
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
  // Simple gray placeholder square with hidden text for screen readers
  return (
    <div 
      className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center" 
      style={{ aspectRatio: '1/1' }}
    >
      <span className="sr-only">Logo placeholder for {app.name}</span>
    </div>
  );
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
