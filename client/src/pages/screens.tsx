import { useState, useEffect } from 'react';
import { Loader2, FileText, Maximize2, ChevronDown, Filter, X, Check } from 'lucide-react';
import { Screen, App } from '@/types';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScreenModal } from '@/components/ui/screen-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useSearch } from 'wouter';
import { ResponsiveImage } from '@/components/ui/responsive-image';
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [currentAppScreens, setCurrentAppScreens] = useState<Screen[]>([]);
  const [currentApp, setCurrentApp] = useState<App | null>(null);
  const [location] = useLocation();
  const search = useSearch();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  // Parse query parameters from URL
  const parseQueryParams = () => {
    if (!search) return;
    
    // Create a URLSearchParams object to easily access the parameters
    const params = new URLSearchParams(search);
    
    // Get tag from query params
    const tagParam = params.get('tag');
    if (tagParam && availableTags.includes(tagParam)) {
      setSelectedTags([tagParam]);
    }
    
    // Get category from query params
    const categoryParam = params.get('category');
    if (categoryParam && availableCategories.includes(categoryParam)) {
      setSelectedCategories([categoryParam]);
    }
  };
  
  // Apply URL query parameters when the page loads and data is available
  useEffect(() => {
    if (availableTags.length > 0 && availableCategories.length > 0 && search) {
      parseQueryParams();
    }
  }, [search, availableTags, availableCategories]);
  
  // Filter screens when selectedTags or selectedCategories change
  useEffect(() => {
    if (allScreens.length === 0) return;
    
    let filtered = [...allScreens];
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(screen => {
        if (!screen.tags || !Array.isArray(screen.tags)) return false;
        
        // At least one of the selected tags must be present in the screen's tags
        return selectedTags.some(tag => screen.tags.includes(tag));
      });
    }
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(screen => {
        // Check for category match in screen category
        if (typeof screen.category === 'string') {
          if (selectedCategories.includes(screen.category)) return true;
        } else if (screen.category && Array.isArray(screen.category)) {
          // Check if any selected category exists in the screen's categories
          if (selectedCategories.some(cat => screen.category.includes(cat))) return true;
        }
        
        // Check for category match in app category
        if (typeof screen.app?.category === 'string') {
          if (selectedCategories.includes(screen.app.category)) return true;
        } else if (screen.app?.category && Array.isArray(screen.app.category)) {
          if (selectedCategories.some(cat => screen.app.category.includes(cat))) return true;
        }
        
        return false;
      });
    }
    
    setFilteredScreens(filtered);
  }, [selectedTags, selectedCategories, allScreens]);

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
        
        // Extract unique tags and categories
        const tags = new Set<string>();
        const categories = new Set<string>();
        
        sortedScreens.forEach(screen => {
          // Extract tags
          if (screen.tags && Array.isArray(screen.tags)) {
            screen.tags.forEach(tag => {
              if (tag && typeof tag === 'string' && tag.trim()) {
                tags.add(tag.trim());
              }
            });
          }
          
          // Extract categories - handle both string and array of strings
          if (screen.category) {
            if (typeof screen.category === 'string' && screen.category.trim()) {
              categories.add(screen.category.trim());
            } else if (Array.isArray(screen.category)) {
              screen.category.forEach(cat => {
                if (cat && typeof cat === 'string' && cat.trim()) {
                  categories.add(cat.trim());
                }
              });
            }
          }
          
          // Also add categories from the app
          if (screen.app?.category) {
            if (typeof screen.app.category === 'string' && screen.app.category.trim()) {
              categories.add(screen.app.category.trim());
            } else if (Array.isArray(screen.app.category)) {
              screen.app.category.forEach(cat => {
                if (cat && typeof cat === 'string' && cat.trim()) {
                  categories.add(cat.trim());
                }
              });
            }
          }
        });
        
        console.log('Available categories:', Array.from(categories));
        
        setAvailableTags(Array.from(tags).sort());
        setAvailableCategories(Array.from(categories).sort());
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
  
  const handleTagFilterChange = (tag: string | null) => {
    if (tag === null) {
      // Clear all tags
      setSelectedTags([]);
    } else {
      // Toggle tag - add if not present, remove if already present
      setSelectedTags(prev => {
        if (prev.includes(tag)) {
          return prev.filter(t => t !== tag);
        } else {
          return [...prev, tag];
        }
      });
    }
  };
  
  const handleCategoryFilterChange = (category: string | null) => {
    if (category === null) {
      // Clear all categories
      setSelectedCategories([]);
    } else {
      // Toggle category - add if not present, remove if already present
      setSelectedCategories(prev => {
        if (prev.includes(category)) {
          return prev.filter(c => c !== category);
        } else {
          return [...prev, category];
        }
      });
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };
  
  const handleRemoveCategory = (category: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== category));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-10">
        <div className="mb-6">
          <Skeleton className="h-10 w-64 mb-2" />
        </div>
        
        <div className="mb-4 flex flex-wrap items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-10">
          {Array(15).fill(0).map((_, index) => (
            <div key={`skeleton-${index}`} className="rounded-lg overflow-hidden">
              <Skeleton className="h-64 w-full" />
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
    <div className="container mx-auto px-4 md:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Todas as telas</h1>
      </div>
      
      <div className="mb-4 flex flex-wrap items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Componentes filter dropdown */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  {'Componentes'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-auto">
                <DropdownMenuLabel>Componentes</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className={selectedTags.length === 0 ? "bg-accent/50" : ""}
                  onClick={() => handleTagFilterChange(null)}
                >
                  Todos os Componentes
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

          {/* Category filter dropdown */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  {'Categoria'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-auto">
                <DropdownMenuLabel>Categoria</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className={selectedCategories.length === 0 ? "bg-accent/50" : ""}
                  onClick={() => handleCategoryFilterChange(null)}
                >
                  Todas as Categorias
                </DropdownMenuItem>
                {availableCategories.map((category: string, index: number) => (
                  <DropdownMenuItem
                    key={`category-${index}-${category}`}
                    className={selectedCategories.includes(category) ? "bg-accent/50" : ""}
                    onClick={() => handleCategoryFilterChange(category)}
                  >
                    <span>{category}</span>
                    {selectedCategories.includes(category) && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Screen counter */}
        <div className="text-gray-600 font-medium">
          {filteredScreens.length} {filteredScreens.length === 1 ? 'tela' : 'telas'}
        </div>
      </div>
      
      {/* Active filter chips below filters */}
      {(selectedTags.length > 0 || selectedCategories.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Componente filter chips */}
          {selectedTags.map(tag => (
            <div 
              key={`chip-tag-${tag}`}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-sm"
            >
              <span>{tag}</span>
              <button 
                onClick={() => handleRemoveTag(tag)}
                className="rounded-full hover:bg-blue-200 p-1 transition-colors"
                aria-label={`Remover filtro de componente ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {/* Category filter chips */}
          {selectedCategories.map(category => (
            <div 
              key={`chip-category-${category}`}
              className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-sm"
            >
              <span>{category}</span>
              <button 
                onClick={() => handleRemoveCategory(category)}
                className="rounded-full hover:bg-purple-200 p-1 transition-colors"
                aria-label={`Remover filtro de categoria ${category}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {/* Clear all filters button (shown only when multiple filters are active) */}
          {(selectedTags.length > 1 || selectedCategories.length > 1 || 
            (selectedTags.length > 0 && selectedCategories.length > 0)) && (
            <button
              onClick={() => {
                setSelectedTags([]);
                setSelectedCategories([]);
              }}
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-sm hover:bg-gray-200"
              aria-label="Limpar todos os filtros"
            >
              <span>Limpar filtros</span>
              <X className="h-3 w-3 ml-1" />
            </button>
          )}
        </div>
      )}
      
      {filteredScreens.length > 0 ? (
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-10"
          role="grid"
          aria-label="Todas as telas"
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
        <div className="text-center py-8 bg-gray-50 rounded-lg mb-10">
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
  const isMobile = useIsMobile();

  // Function to get component background color
  const getTagColor = (tag: string): string => {
    type ColorMap = {
      [key: string]: string;
    };
    
    const colors: ColorMap = {
      'navigation': 'bg-blue-100',
      'form': 'bg-green-100',
      'chart': 'bg-purple-100',
      'modal': 'bg-yellow-100',
      'card': 'bg-pink-100', 
      'loading': 'bg-orange-100',
      'splash-screen': 'bg-teal-100',
      'avatar': 'bg-indigo-100',
      'button': 'bg-red-100',
      'filter': 'bg-cyan-100',
      'icon': 'bg-lime-100',
      'dropdown': 'bg-amber-100',
      'list': 'bg-violet-100',
      'input': 'bg-emerald-100',
      'onboarding': 'bg-sky-100',
      'callout': 'bg-rose-100'
    };
    
    const tagLower = tag.toLowerCase();
    // Default color for unknown components
    return colors[tagLower] || 'bg-gray-100';
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
        <ResponsiveImage 
          src={screen.imageUrl} 
          alt={`${screen.app?.name ? screen.app.name + ': ' : ''}${screen.name} - ${screen.description || 'Screen view'}`}
          className="w-full h-full object-contain"
          placeholderClassName="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse"
          placeholder={
            <span className="sr-only">Loading screen image for {screen.name}</span>
          }
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
          widths={[300, 600, 900]}
          format="webp"
          quality={80}
        />
        
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
      <div className="mt-2">
        {/* Screen name hidden as requested */}
        
        {/* App name and logo */}
        {screen.app && (
          <div className="flex items-center gap-2 mt-0">
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {screen.app.logo ? (
                <ResponsiveImage 
                  src={screen.app.logo}
                  alt={`${screen.app.name} Logo`}
                  className="w-5 h-5"
                  widths={[20, 40, 60]}
                  quality={90}
                  placeholder={
                    <div className="w-5 h-5 rounded-sm bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600">{screen.app.name.charAt(0)}</span>
                    </div>
                  }
                />
              ) : (
                <div className="w-5 h-5 rounded-sm bg-gray-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">{screen.app.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{screen.app.name}</p>
          </div>
        )}
        
        {/* Tags and Categories removed from thumbnails and moved to modal */}
      </div>
    </div>
  );
}