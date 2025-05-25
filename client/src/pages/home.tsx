import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApps } from "@/lib/airtable";
import AppCard from "@/components/app-card";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, X, Clock, Grid, Eye } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<string>("none"); // Track the current sort method
  
  // Enhanced query with retry logic and better error handling
  const { isLoading, error, data: apps } = useQuery({
    queryKey: ['/api/apps'],
    queryFn: () => fetchApps({}),
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    staleTime: 60000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: true, // Refresh when user returns to the tab
    refetchOnReconnect: true // Refresh when network reconnects
  });
  
  // Fetch categories with their icons from the API
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    },
    staleTime: 60000 // Consider data fresh for 1 minute
  });
  
  // Extract available categories and their icons
  useEffect(() => {
    if (!apps || apps.length === 0) return;

    // Function to get categories that actually have apps
    const getActiveCategories = () => {
      if (!apps || apps.length === 0) return [];
      
      // Get all unique categories that have at least one app
      const usedCategories = new Set<string>();
      apps.forEach(app => {
        const appCategory = getAppCategory(app);
        if (appCategory) {
          usedCategories.add(appCategory);
        }
      });
      
      return Array.from(usedCategories);
    };

    if (categoriesData && categoriesData.length > 0) {
      // Get categories that actually have apps
      const activeCategories = getActiveCategories();
      
      // Filter the category data to only include categories with apps
      const filteredCategoryNames = categoriesData
        .map((cat: any) => cat.name)
        .filter(name => activeCategories.includes(name));
      
      setAvailableCategories(filteredCategoryNames);
      
      // Create a map of category names to their icon URLs
      const iconMap: Record<string, string> = {};
      categoriesData.forEach((cat: any) => {
        if (cat.name && cat.iconUrl && activeCategories.includes(cat.name)) {
          iconMap[cat.name] = cat.iconUrl;
        }
      });
      setCategoryIcons(iconMap);
      
      // By default, no filter should be active (empty array of selected categories)
      setSelectedCategories([]);
      
      console.log("Available categories with icons:", filteredCategoryNames);
    } else if (apps && apps.length > 0) {
      // Get active categories even for fallback
      const activeCategories = getActiveCategories();
      
      // Fallback to predefined categories if API fails, but only show ones with apps
      const predefinedCategories = ["Cidadania", "Finanças", "Logística", "Portal", "Saúde", "Trabalho"]
        .filter(cat => activeCategories.includes(cat));
      
      setAvailableCategories(predefinedCategories);
      
      // By default, no filter should be active (empty array of selected categories)
      setSelectedCategories([]);
      
      console.log("Using fallback categories:", predefinedCategories);
    }
  }, [categoriesData, apps]);
  
  // State for tracking scroll arrows visibility
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  // Handle scroll event to update arrow visibility
  const handleCategoryScroll = () => {
    const container = document.querySelector('.category-scroll') as HTMLElement;
    if (container) {
      // Show left arrow only if scrolled right
      setShowLeftArrow(container.scrollLeft > 20);
      
      // Show right arrow only if there's more content to scroll
      const isEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 20;
      setShowRightArrow(!isEnd);
    }
  };
  
  // Add scroll event listener
  useEffect(() => {
    const container = document.querySelector('.category-scroll');
    if (container) {
      container.addEventListener('scroll', handleCategoryScroll);
      // Initial check
      handleCategoryScroll();
    }
    
    return () => {
      const container = document.querySelector('.category-scroll');
      if (container) {
        container.removeEventListener('scroll', handleCategoryScroll);
      }
    };
  }, [availableCategories]);
  
  // Get category icon based on category name
  const getCategoryIcon = (category: string): React.ReactNode => {
    // Check if we have an icon URL for this category from the Airtable data
    if (categoryIcons[category]) {
      return (
        <img 
          src={categoryIcons[category]} 
          alt={`${category} icon`} 
          className="w-full h-full object-contain"
          loading="lazy"
        />
      );
    }
    
    // Fallback to emoji icons if no Airtable icon is available
    switch (category) {
      case "Cidadania":
        return <span className="inline-block w-full h-full">👤</span>;
      case "Finanças":
        return <span className="inline-block w-full h-full">💰</span>;
      case "Logística":
        return <span className="inline-block w-full h-full">🚚</span>;
      case "Portal":
        return <span className="inline-block w-full h-full">🌐</span>;
      case "Saúde":
        return <span className="inline-block w-full h-full">❤️</span>;
      case "Trabalhos":
        return <span className="inline-block w-full h-full">💼</span>;
      case "Mobilidade":
        return <span className="inline-block w-full h-full">🚗</span>;
      case "Segurança":
        return <span className="inline-block w-full h-full">🔒</span>;
      default:
        return <span className="inline-block w-full h-full">📱</span>;
    }
  };
  
  // Direct category mapping from app data - uses both categories array and category field
  const getAppCategory = (app: any): string => {
    if (!app) return "Portal";
    
    // Use categories array if available
    if (app.categories && Array.isArray(app.categories) && app.categories.length > 0) {
      return app.categories[0]; // Return the first category in the array
    }
    
    // Fallback to category field
    if (app.category === "Finanças") return "Finanças";
    if (app.category === "Cidadania") return "Cidadania"; 
    if (app.category === "Saúde") return "Saúde";
    if (app.category === "Logística") return "Logística";
    if (app.category === "Trabalho" || app.category === "Trabalhos") return "Trabalho"; // Use consistent "Trabalho" category
    if (app.category === "Portal") return "Portal";
    
    // Name-based overrides for specific apps we know about
    if (app.name === "CAIXA" || app.name === "Meu INSS" || app.name === "Tesouro Direto") {
      return "Finanças";
    }
    if (app.name === "Carteira de Trabalho Digital") {
      return "Trabalho"; // Match Airtable category exactly
    }
    if (app.name === "Carteira Digital de Transito") {
      return "Mobilidade"; // Assign to a more appropriate category
    }
    if (app.name === "Meu SUS Digital") {
      return "Saúde";
    }
    if (app.name === "Correios") {
      return "Logística";
    }
    if (app.name === "e-Título") {
      return "Cidadania";
    }
    if (app.name === "gov.br") {
      return "Portal";
    }
    if (app.name === "Conecta Recife") {
      return "Portal";
    }
    
    // Fallback to type-based categorization
    return "Portal";
  };
  
  // Filter and sort apps based on selected categories and sort method
  const filteredApps = useMemo(() => {
    if (!apps) return [];
    
    // First, filter by category
    let filtered = apps.filter(app => {
      // If no categories are selected, show all apps
      if (selectedCategories.length === 0) {
        return true;
      }
      
      // Get the appropriate category for this app
      const appCategory = getAppCategory(app);
      
      // Log for debugging
      if (selectedCategories.includes("Finanças")) {
        console.log(`App: ${app.name}, Category: ${app.category}, Type: ${app.type}, Assigned Category: ${appCategory}`);
      }
      
      // Check if the app's category is included in the selected categories
      return selectedCategories.includes(appCategory);
    });
    
    // Then, apply sorting
    if (sortBy === "latest") {
      // Sort by latest updated
      filtered = [...filtered].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      console.log("Sorting by latest updated");
    } 
    else if (sortBy === "screens") {
      // Sort by most screens (using ID as placeholder)
      filtered = [...filtered].sort((a, b) => Number(b.id) - Number(a.id));
      console.log("Sorting by screens count");
    }
    else if (sortBy === "views") {
      // Sort by most viewed (using name as placeholder)
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      console.log("Sorting by views");
    }
    
    return filtered;
  }, [apps, selectedCategories, sortBy]);
  
  // Handle category filter change - now as single selection only
  const handleCategoryFilterChange = (category: string | null) => {
    if (category === null) {
      // If "Todos" or current category is clicked again, clear selection
      setSelectedCategories([]);
    } else {
      // Replace the current selection with the new category
      setSelectedCategories([category]);
    }
  };
  
  return (
    <div>
      <div className="container mx-auto px-4 md:px-6 pt-6 pb-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{t('header.apps')}</h1>
        </div>
        
        {/* Category Tabs */}
        <div className="mb-8">
          <div className="relative">
            {/* Left arrow for horizontal scroll - hidden at start */}
            {showLeftArrow && (
              <button 
                onClick={() => {
                  const container = document.querySelector('.category-scroll');
                  if (container) {
                    container.scrollBy({ left: -200, behavior: 'smooth' });
                  }
                }}
                className="absolute left-0 top-0 bottom-0 z-10 px-2 hover:bg-gray-50 transition-opacity flex items-center h-full"
                aria-label="Scroll left"
              >
                <ChevronDown className="h-5 w-5 transform rotate-90" />
              </button>
            )}
            
            <div 
              className="overflow-x-auto category-scroll pl-0 pr-8 border-b border-gray-100 scrollbar-hide"
              onScroll={handleCategoryScroll}
            >
              <div className="flex space-x-6 min-w-max pl-0">
                {/* "Todos" button */}
                <button
                  key="tab-all"
                  onClick={() => handleCategoryFilterChange(null)}
                  className={`px-4 py-3 whitespace-nowrap transition-all flex flex-col items-center relative ${
                    selectedCategories.length === 0
                      ? 'text-primary font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-label="Todos"
                >
                  <div className="inline-block w-14 h-14 mb-1">
                    <span className="inline-block w-full h-full">🔍</span>
                  </div>
                  <span>{t('filters.all')}</span>
                  {selectedCategories.length === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                  )}
                </button>
                
                {availableCategories && availableCategories.map((category, index) => (
                  <button
                    key={`tab-${index}-${category}`}
                    onClick={() => handleCategoryFilterChange(category)}
                    className={`px-4 py-3 whitespace-nowrap transition-all flex flex-col items-center relative ${
                      selectedCategories.includes(category) 
                        ? 'text-primary font-medium' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    aria-label={category}
                  >
                    <div className="inline-block w-14 h-14 mb-1">
                      {getCategoryIcon(category)}
                    </div>
                    <span>{category}</span>
                    {selectedCategories.includes(category) && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Right arrow for horizontal scroll - hidden at end */}
            {showRightArrow && (
              <button 
                onClick={() => {
                  const container = document.querySelector('.category-scroll');
                  if (container) {
                    container.scrollBy({ left: 200, behavior: 'smooth' });
                  }
                }}
                className="absolute right-0 top-0 bottom-0 z-10 px-2 hover:bg-gray-50 transition-opacity flex items-center h-full"
                aria-label="Scroll right"
              >
                <ChevronDown className="h-5 w-5 transform -rotate-90" />
              </button>
            )}
          </div>
        </div>
        
        {/* Filter section */}
        <div className="mb-4 flex flex-wrap items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Order by dropdown */}
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    aria-label="Ordenar por"
                    aria-haspopup="true"
                  >
                    {sortBy === "none" && t('filters.orderBy')}
                    {sortBy === "latest" && t('filters.latestUpdated')}
                    {sortBy === "screens" && t('filters.moreScreens')}
                    {sortBy === "views" && t('filters.mostViewed')}
                    <ChevronDown className="h-4 w-4 ml-2" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>{t('filters.orderBy')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className={sortBy === "none" ? "bg-accent/50" : ""}
                    onClick={() => setSortBy("none")}
                  >
                    <span>{t('filters.noOrder')}</span>
                    {sortBy === "none" && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={sortBy === "latest" ? "bg-accent/50" : ""}
                    onClick={() => setSortBy("latest")}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{t('filters.latestUpdated')}</span>
                    {sortBy === "latest" && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={sortBy === "screens" ? "bg-accent/50" : ""}
                    onClick={() => setSortBy("screens")}
                  >
                    <Grid className="mr-2 h-4 w-4" />
                    <span>{t('filters.moreScreens')}</span>
                    {sortBy === "screens" && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={sortBy === "views" ? "bg-accent/50" : ""}
                    onClick={() => setSortBy("views")}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    <span>{t('filters.mostViewed')}</span>
                    {sortBy === "views" && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* App counter */}
          <div className="text-gray-600 font-medium flex flex-col items-end">
            <span>{t('filters.showing')}</span>
            <span className="font-semibold">{filteredApps?.length || 0} {t('header.apps').toLowerCase()}</span>
          </div>
        </div>
        
        {/* Removed filter tag chips as requested */}
        
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
                  <Skeleton className="w-full h-48" />
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div>
                        <Skeleton className="w-32 h-5 mb-1" />
                        <Skeleton className="w-20 h-4" />
                      </div>
                    </div>
                    <Skeleton className="w-full h-12 mb-3" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="w-16 h-4" />
                      <Skeleton className="w-24 h-6 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              Error: {(error as Error).message}
            </div>
          ) : (
            <>
              {/* Grid with more columns to show more apps per row */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredApps && filteredApps.map((app, index) => (
                  <AppCard key={app.id} app={app} isPriority={index < 8} />
                ))}
              </div>
              
              {/* Warning callout for fewer apps removed as requested */}
              
              {filteredApps && filteredApps.length === 0 && (
                <div className="bg-white p-8 rounded-lg text-center">
                  <h3 className="font-medium text-lg mb-2">{t('filters.noResults')}</h3>
                  <p className="text-gray-500">{t('filters.tryAdjusting')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
