import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, FileText, Maximize2, ChevronDown, Filter, X, Check, Link2, Copy, ExternalLink, Smartphone, Tag } from 'lucide-react';
import { Screen, App } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScreenModal } from '@/components/ui/screen-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation, useSearch } from 'wouter';
import { ResponsiveImage } from '@/components/ui/responsive-image';
import { createSlug } from '@/lib/slugUtils';
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
  const { toast } = useToast();
  const [allScreens, setAllScreens] = useState<Array<Screen & { app?: App }>>([]);
  const [filteredScreens, setFilteredScreens] = useState<Array<Screen & { app?: App }>>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagCounts, setTagCounts] = useState<{[key: string]: number}>({});
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [currentAppScreens, setCurrentAppScreens] = useState<Array<Screen & { category?: string | string[] | null }>>([]);
  const [currentApp, setCurrentApp] = useState<(App & { airtableId?: string, slug?: string | null }) | null>(null);
  const [displayedScreenCount, setDisplayedScreenCount] = useState(50); // Exibir inicialmente apenas 50 telas para melhorar performance
  const [totalAirtableScreens, setTotalAirtableScreens] = useState(0); // Número total de telas no Airtable
  const [location] = useLocation();
  const search = useSearch();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  // State for responsive tag display
  const [visibleTagCount, setVisibleTagCount] = useState(6);
  
  // State to track scroll navigation visibility
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  // Function to update pagination dots
  const updateDots = useCallback(() => {
    const container = document.getElementById('tags-scroll-container');
    const dotsContainer = document.getElementById('pagination-dots');
    
    if (!container || !dotsContainer) return;
    
    // Calculate how many "pages" we have
    const containerWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;
    const numDots = Math.ceil(scrollWidth / containerWidth);
    
    // Clear existing dots
    dotsContainer.innerHTML = '';
    
    // Calculate which dot should be active
    const scrollPosition = container.scrollLeft;
    const activeDotIndex = Math.floor(scrollPosition / containerWidth);
    
    // Update arrow visibility
    setShowLeftArrow(scrollPosition > 10); // Show left arrow if not at the start
    setShowRightArrow(scrollPosition < scrollWidth - containerWidth - 10); // Show right arrow if not at the end
    
    // Create dots
    for (let i = 0; i < numDots; i++) {
      const dot = document.createElement('div');
      dot.className = i === activeDotIndex 
        ? 'h-2 w-2 rounded-full bg-green-600' 
        : 'h-2 w-2 rounded-full bg-gray-300';
      
      // Add click handler to scroll to that position
      dot.addEventListener('click', () => {
        container.scrollTo({
          left: i * containerWidth,
          behavior: 'smooth'
        });
      });
      
      dotsContainer.appendChild(dot);
    }
  }, []);
  
  // Set visible tags based on screen size and initialize pagination dots
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setVisibleTagCount(12); // Large screens - show more components
      } else if (window.innerWidth >= 768) {
        setVisibleTagCount(9);  // Medium screens
      } else {
        setVisibleTagCount(6);  // Small/mobile screens
      }
      
      // Update pagination dots on resize
      updateDots();
    };
    
    // Initial setup
    handleResize();
    
    // Add event listener for window resize
    window.addEventListener('resize', handleResize);
    
    // Initialize dots after DOM is ready
    const timer = setTimeout(() => {
      updateDots();
    }, 500);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [updateDots]);
  
  // Parse query parameters from URL
  const parseQueryParams = () => {
    if (!search) return;
    
    // Create a URLSearchParams object to easily access the parameters
    const params = new URLSearchParams(search);
    
    // Get tag from query params
    const tagParam = params.get('tag');
    if (tagParam && availableTags.includes(tagParam)) {
      setSelectedTag(tagParam);
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
  
  // Filter screens when selectedTag or selectedCategories change
  useEffect(() => {
    if (allScreens.length === 0) return;
    
    let filtered = [...allScreens];
    
    if (selectedTag) {
      filtered = filtered.filter(screen => {
        if (!screen.tags || !Array.isArray(screen.tags)) return false;
        
        // Selected tag must be present in the screen's tags
        return screen.tags.includes(selectedTag);
      });
    }
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(screen => {
        // Check for category match in screen category
        if (screen.category) {
          if (typeof screen.category === 'string') {
            if (selectedCategories.includes(screen.category)) return true;
          } else if (Array.isArray(screen.category)) {
            // Check if any selected category exists in the screen's categories
            if (selectedCategories.some(cat => screen.category?.includes(cat))) return true;
          }
        }
        
        // Check for category match in app category
        if (screen.app?.category) {
          if (typeof screen.app.category === 'string') {
            if (selectedCategories.includes(screen.app.category)) return true;
          } else if (Array.isArray(screen.app.category)) {
            if (selectedCategories.some(cat => screen.app?.category?.includes(cat))) return true;
          }
        }
        
        return false;
      });
    }
    
    setFilteredScreens(filtered);
    // Mantém o mesmo número de telas exibidas, sem redefinir
  }, [selectedTag, selectedCategories, allScreens]);

  // Otimização: uso de Promise.all para paralelizar requisições
  // e melhorar o TBT (Total Blocking Time)
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
        
        // Otimização: Fetch all screens in parallel with Promise.all
        // Isso reduz significativamente o tempo de carregamento e o TBT
        const fetchedScreensPromises = fetchedApps.map(async (app) => {
          const screensResponse = await fetch(`/api/apps/${app.id}/screens`);
          const appScreens = await screensResponse.json();
          
          if (Array.isArray(appScreens)) {
            // Add app information to each screen for display
            return appScreens.map(screen => ({
              ...screen,
              app: app
            }));
          }
          return [];
        });
        
        // Aguarda todas as requisições em paralelo
        const screensByApp = await Promise.all(fetchedScreensPromises);
        
        // Combina todos os arrays de telas em um único array
        const fetchedScreens = screensByApp.flat();
        
        // Armazenar o número total de telas do Airtable
        setTotalAirtableScreens(fetchedScreens.length);
        
        // Otimização: Limita o número de telas para reduzir o DOM e melhorar a performance
        // Fisher-Yates shuffle algorithm - mais eficiente para grandes arrays
        const shuffleArray = (array: any[]) => {
          // Usando todo o array sem limitação
          const result = [...array];
          
          for (let i = result.length - 1; i > 0; i--) {
            // Usando Bitwise OR 0 para converter para inteiro (mais rápido que Math.floor)
            const j = (Math.random() * (i + 1)) | 0;
            [result[i], result[j]] = [result[j], result[i]];
          }
          
          return result;
        };
        
        const randomizedScreens = shuffleArray(fetchedScreens);
        
        // Otimização: extração de tags e categorias em uma única passagem
        // evitando múltiplos loops e manipulação de arrays
        const tags = new Set<string>();
        const categories = new Set<string>();
        
        // Processamento em Web Worker não é ideal aqui pois precisa de estado compartilhado
        // mas podemos otimizar o loop para ser mais eficiente
        randomizedScreens.forEach((screen: Screen & { app?: App }) => {
          // Extract tags - otimizado para evitar loops aninhados
          if (screen.tags && Array.isArray(screen.tags)) {
            for (let i = 0; i < screen.tags.length; i++) {
              const tag = screen.tags[i];
              if (tag && typeof tag === 'string' && tag.trim()) {
                tags.add(tag.trim());
              }
            }
          }
          
          // Extract categories - handle both string and array of strings
          if (screen.category) {
            if (typeof screen.category === 'string' && screen.category.trim()) {
              categories.add(screen.category.trim());
            } else if (Array.isArray(screen.category)) {
              for (let i = 0; i < screen.category.length; i++) {
                const cat = screen.category[i];
                if (cat && typeof cat === 'string' && cat.trim()) {
                  categories.add(cat.trim());
                }
              }
            }
          }
          
          // Also add categories from the app
          if (screen.app?.category) {
            if (typeof screen.app.category === 'string' && screen.app.category.trim()) {
              categories.add(screen.app.category.trim());
            } else if (Array.isArray(screen.app.category)) {
              for (let i = 0; i < screen.app.category.length; i++) {
                const cat = screen.app.category[i];
                if (cat && typeof cat === 'string' && cat.trim()) {
                  categories.add(cat.trim());
                }
              }
            }
          }
        });
        
        // Convertendo Set para Array apenas uma vez no final, para economizar operações
        const sortedTags = Array.from(tags).sort();
        const sortedCategories = Array.from(categories).sort();
        
        console.log('Available categories:', sortedCategories);
        
        setAvailableTags(sortedTags);
        setAvailableCategories(sortedCategories);
        setAllScreens(randomizedScreens);
        setFilteredScreens(randomizedScreens);
        
        // Initialize pagination dots after a short delay to ensure DOM is ready
        setTimeout(() => {
          updateDots();
        }, 500);
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
    
    // Cast types for compatibility with ScreenModal component
    setCurrentAppScreens(appScreens as Array<Screen & { category?: string | string[] | null }>);
    setCurrentApp(screen.app as (App & { airtableId?: string, slug?: string | null }));
    setCurrentScreenIndex(index >= 0 ? index : 0);
    setIsModalOpen(true);
  };
  
  const handleTagFilterChange = (tag: string | null) => {
    if (tag === null) {
      // Clear selected tag
      setSelectedTag(null);
    } else {
      // Toggle tag - select if not current, clear if already selected
      if (selectedTag === tag) {
        setSelectedTag(null); // Deselect if clicked on the currently selected tag
      } else {
        setSelectedTag(tag); // Select the new tag
      }
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
  
  // No longer needed with single selection
  const clearSelectedTag = () => {
    setSelectedTag(null);
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
        <h1 className="text-3xl font-bold mb-2">{t('screens.allScreens')}</h1>
      </div>
      
      <div className="mb-8">
        {/* Highlighted components section - showing top 4 components with most screens */}
        {popularTags.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">{t('screens.popularComponents')}</h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map(tag => (
                <button
                  key={`popular-${tag}`}
                  onClick={() => handleTagFilterChange(tag)}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-green-600 text-white'
                      : 'border-2 border-green-500 text-green-700 hover:bg-green-50'
                  }`}
                >
                  {tag}
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {tagCounts[tag]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      
        {/* Component tags with horizontal scroll - tab style with green bottom divider and grey background */}
        <div className="mb-4 relative">
          {/* Navigation arrows */}
          <div className="flex items-center relative">
            {/* Left arrow button - only shown when not at the start */}
            {showLeftArrow && (
              <button 
                className="absolute left-0 z-10 flex items-center justify-center h-8 w-8 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                onClick={() => {
                  const container = document.getElementById('tags-scroll-container');
                  if (container) {
                    container.scrollBy({ left: -200, behavior: 'smooth' });
                    updateDots();
                  }
                }}
                aria-label="Scroll left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            {/* Scrollable container with hidden scrollbar, organized in 2-row grid */}
            <div 
              id="tags-scroll-container"
              className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto pb-2 scrollbar-none w-full border-b border-gray-200 pr-8 pl-0 auto-cols-max" 
              onScroll={() => updateDots()}
              style={{ gridAutoColumns: "min-content" }}
            >
              {/* All tags in a grid layout with two rows */}
              {availableTags.map((tag: string) => (
                <button
                  key={`tag-tab-${tag}`}
                  onClick={() => handleTagFilterChange(tag)}
                  className={`px-4 py-2 text-sm font-medium transition-colors flex-shrink-0 relative rounded-md ${
                    selectedTag === tag
                      ? 'bg-gray-200 text-green-600 font-semibold'
                      : 'bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-150'
                  }`}
                >
                  {tag}
                  {selectedTag === tag && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-t-sm"></div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Right arrow button - only shown when not at the end */}
            {showRightArrow && (
              <button 
                className="absolute right-0 z-10 flex items-center justify-center h-8 w-8 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                onClick={() => {
                  const container = document.getElementById('tags-scroll-container');
                  if (container) {
                    container.scrollBy({ left: 200, behavior: 'smooth' });
                    updateDots();
                  }
                }}
                aria-label="Scroll right"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Pagination dots removed as requested */}
        </div>
      </div>
      
      {/* Order dropdown and screen counter in same row */}
      <div className="mb-4 flex flex-wrap items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Order by dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                aria-label={t('filters.orderBy')}
                aria-haspopup="true"
              >
                {t('filters.orderBy')}
                <ChevronDown className="h-4 w-4 ml-2" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>{t('filters.orderBy')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {/* Implement order logic */}}>
                {t('filters.orderNewest')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* Implement order logic */}}>
                {t('filters.orderByApp')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* Implement order logic */}}>
                {t('filters.orderByCategory')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Category filter dropdown removed as requested */}
        </div>
        
        {/* Screen counter - updated format "X de XX telas" */}
        <div className="text-gray-600 font-medium">
          <span className="font-semibold">
            {t('filters.showing')} {Math.min(displayedScreenCount, filteredScreens.length)} {t('screens.of')} {filteredScreens.length} {t('filters.screens')}
          </span>
        </div>
      </div>
      
      {/* Removed active filter chips as requested */}
      
      {filteredScreens.length > 0 ? (
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-10"
          role="grid"
          aria-label={t('screens.allScreens')}
        >
          {/* 
            Carregamos apenas um subconjunto das telas para reduzir o tamanho do DOM
            e aumentar a performance - isto reduzirá o TBT (Total Blocking Time)
          */}
          {filteredScreens.slice(0, displayedScreenCount).map((screen: Screen & { app?: App }, index) => (
            <div 
              key={screen.id} 
              role="gridcell"
              className="cursor-pointer hover:opacity-90 transition-all"
              onClick={() => handleOpenModal(screen)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenModal(screen);
                }
              }}
              tabIndex={0}
              aria-label={`Ver detalhes de ${screen.name || 'tela'}`}
            >
              <div 
                className="overflow-hidden relative group flex items-center justify-center" 
                style={{ width: '100%', aspectRatio: '9/19' }}
              >
                {/* Utilizando ResponsiveImage com suporte ao Cloudinary */}
                <ResponsiveImage 
                  src={screen.imageUrl}
                  cloudinarySrc={screen.cloudinaryUrl}
                  alt={screen.name || 'Tela de aplicativo'}
                  className="w-full h-full object-cover border border-gray-200 rounded-lg"
                  widths={[300, 450, 600]}
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  format="webp"
                  quality={85}
                  priority={index < 5}
                  loading={index < 5 ? "eager" : "lazy"}
                  placeholder={
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="sr-only">Loading image for {screen.name || 'screen'}</span>
                    </div>
                  }
                />
                
                {/* Overlay com efeito hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg"></div>
              </div>
              
              {/* Informações do app relacionado */}
              {screen.app && (
                <Link 
                  href={`/app/${createSlug(screen.app.name)}`}
                  className="flex items-center gap-2 mt-2 hover:bg-gray-50 p-1 rounded-md cursor-pointer transition-colors no-underline"
                  onClick={(e) => {
                    e.stopPropagation(); // Evita que a tela seja aberta ao clicar no app
                    // Garantir scroll para o topo ao navegar
                    window.scrollTo(0, 0);
                  }}
                  title={`Ver detalhes do app ${screen.app.name}`}
                >
                  <div className="w-5 h-5 flex items-center justify-center overflow-hidden">
                    {screen.app.logo ? (
                      <ResponsiveImage 
                        src={screen.app.logo}
                        cloudinarySrc={screen.app.cloudinaryLogo}
                        alt={`${screen.app.name} Logo`}
                        className="w-4 h-4 object-contain"
                        widths={[16, 32, 64]}
                        quality={90}
                        placeholder={
                          <div className="w-4 h-4 flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
                            <span className="sr-only">Loading logo for {screen.app.name}</span>
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-4 h-4 flex items-center justify-center opacity-50" style={{ aspectRatio: '1/1' }}>
                        <span className="sr-only">Logo placeholder for {screen.app.name}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-black truncate">{screen.app.name}</span>
                </Link>
              )}
            </div>
          ))}
          
          {/* Botão para carregar mais telas se ainda houver mais telas para mostrar */}
          {filteredScreens.length > displayedScreenCount && (
            <div className="col-span-full text-center py-6 flex flex-col items-center">
              <p className="text-gray-500 mb-3 text-sm">
                {t('screens.showing')} {displayedScreenCount} {t('screens.of')} {filteredScreens.length} {t('app.screens')}
              </p>
              <button
                onClick={() => {
                  // Incrementar o número de telas mostradas em 50
                  const nextBatch = Math.min(displayedScreenCount + 50, filteredScreens.length);
                  setDisplayedScreenCount(nextBatch);
                  
                  // Scroll suave para mostrar as novas telas
                  window.scrollBy({
                    top: 200,
                    behavior: 'smooth'
                  });
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-md shadow-sm transition-colors"
                aria-label={t('screens.loadMore')}
              >
                {t('screens.loadMore')}
              </button>
            </div>
          )}
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
      
      {/* Próximos passos section removed as requested */}
      
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
  const { toast } = useToast();
  const { t } = useTranslation();

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
      <div className="rounded-lg overflow-hidden shadow-sm relative group flex items-center justify-center" style={{ aspectRatio: "9/19" }}>
        <ResponsiveImage 
          src={screen.imageUrl} 
          cloudinarySrc={screen.cloudinaryUrl}
          alt={`${screen.app?.name ? screen.app.name + ': ' : ''}${screen.name} - ${screen.description || 'Screen view'}`}
          className="w-full h-full object-cover border border-gray-200 rounded-lg"
          placeholderClassName="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse"
          placeholder={
            <span className="sr-only">Loading screen image for {screen.name}</span>
          }
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
          widths={[300, 600, 900]}
          format="webp"
          quality={80}
        />
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg"></div>
      </div>
      <div className="mt-2">
        {/* Screen name hidden as requested */}
        
        {/* App name and logo */}
        {screen.app && (
          <Link 
            href={`/app/${createSlug(screen.app.name)}`} 
            className="flex items-center gap-2 mt-0 hover:bg-gray-50 p-1 rounded-md cursor-pointer transition-colors no-underline"
            onClick={(e) => {
              e.stopPropagation(); // Evita que a tela seja aberta ao clicar no app
              // Garantir scroll para o topo ao navegar
              window.scrollTo(0, 0);
            }}
            title={`Ver detalhes do app ${screen.app.name}`}
          >
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center overflow-hidden">
              {screen.app.logo ? (
                <ResponsiveImage 
                  src={screen.app.logo}
                  cloudinarySrc={screen.app.cloudinaryLogo}
                  alt={`${screen.app.name} Logo`}
                  className="w-4 h-4 object-contain"
                  widths={[20, 40, 60]}
                  quality={90}
                  placeholder={
                    <div className="w-4 h-4 flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
                      <span className="sr-only">Loading logo for {screen.app.name}</span>
                    </div>
                  }
                />
              ) : (
                <div className="w-4 h-4 flex items-center justify-center opacity-50" style={{ aspectRatio: '1/1' }}>
                  <span className="sr-only">Logo placeholder for {screen.app.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-black truncate">{screen.app.name}</p>
          </Link>
        )}
        
        {/* Tags and Categories removed from thumbnails and moved to modal */}
      </div>
    </div>
  );
}