import { useState, useEffect, useMemo, useRef } from "react";
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
    if (categoriesData && categoriesData.length > 0) {
      // Extract category names from the API response
      const categoryNames = categoriesData.map((cat: any) => cat.name);
      setAvailableCategories(categoryNames);
      
      // Create a map of category names to their icon URLs
      const iconMap: Record<string, string> = {};
      categoriesData.forEach((cat: any) => {
        if (cat.name && cat.iconUrl) {
          iconMap[cat.name] = cat.iconUrl;
        }
      });
      setCategoryIcons(iconMap);
      
      // By default, no filter should be active (empty array of selected categories)
      setSelectedCategories([]);
      
      console.log("Available categories with icons:", categoryNames);
    } else if (apps && apps.length > 0) {
      // Fallback to predefined categories if API fails
      const predefinedCategories = ["Cidadania", "Finanças", "Logística", "Portal", "Saúde", "Trabalhos"];
      setAvailableCategories(predefinedCategories);
      
      // By default, no filter should be active (empty array of selected categories)
      setSelectedCategories([]);
      
      console.log("Using fallback categories:", predefinedCategories);
    }
  }, [categoriesData, apps]);
  
  // State for tracking scroll arrows visibility and drag functionality
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  
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
  
  // Handle mouse/touch events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Adjust speed factor as needed
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };
  
  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Add scroll event listener and cleanup dragging events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleCategoryScroll);
      // Initial check
      handleCategoryScroll();
    }
    
    // Add global event listeners to handle dragging ending outside the container
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (scrollContainerRef.current) {
          scrollContainerRef.current.style.cursor = 'grab';
        }
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalMouseUp);
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleCategoryScroll);
      }
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [availableCategories, isDragging]);
  
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
    if (app.category === "Trabalho" || app.category === "Trabalhos") return "Trabalhos"; // Handle both "Trabalho" and "Trabalhos"
    if (app.category === "Portal") return "Portal";
    
    // Name-based overrides for specific apps we know about
    if (app.name === "CAIXA" || app.name === "Meu INSS" || app.name === "Tesouro Direto") {
      return "Finanças";
    }
    if (app.name === "Carteira de Trabalho Digital") {
      return "Trabalhos"; // Updated to match "Trabalhos"
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
                className="absolute left-0 top-0 bottom-0 z-10 bg-white px-2 hover:bg-gray-100 transition-opacity flex items-center h-full"
                aria-label="Scroll left"
              >
                <ChevronDown className="h-5 w-5 transform rotate-90" />
              </button>
            )}
            
            <div 
              ref={scrollContainerRef}
              className="overflow-x-auto category-scroll pb-2 pl-0 pr-8 cursor-grab"
              onScroll={handleCategoryScroll}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            >
              <div className="flex space-x-2 min-w-max pl-0">
                {/* Removed "Todos" button as requested */}
                
                {availableCategories && availableCategories.map((category, index) => (
                  <button
                    key={`tab-${index}-${category}`}
                    onClick={() => handleCategoryFilterChange(category)}
                    className={`px-4 py-3 rounded-md whitespace-nowrap transition-all flex flex-col items-center ${
                      selectedCategories.includes(category) 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    aria-label={category}
                  >
                    <div className="inline-block w-10 h-10 mb-1">
                      {getCategoryIcon(category)}
                    </div>
                    <span>{category}</span>
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
                className="absolute right-0 top-0 bottom-0 z-10 bg-white px-2 hover:bg-gray-100 transition-opacity flex items-center h-full"
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
              
              {/* Show a warning if fewer apps than expected are displayed */}
              {filteredApps && filteredApps.length > 0 && filteredApps.length < 8 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-6">
                  <p className="text-yellow-700 text-sm mb-2 font-medium">
                    {t('filters.someAppsHidden')}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {t('filters.tryRefreshing')}
                  </p>
                </div>
              )}
              
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
