import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApps } from "@/lib/airtable";
import AppCard from "@/components/app-card";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, X, Clock, Grid, Eye, Share2 } from "lucide-react";
// Using root project image instead of local SVG
import { useTranslation } from 'react-i18next';
import { useLocation, useRoute } from "wouter";

export default function Home() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<string>("none"); // Track the current sort method
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  
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
  
  // Parse URL parameters for category filtering
  useEffect(() => {
    if (!availableCategories.length) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    if (categoryParam) {
      // Map English category name from URL to Portuguese internal category name
      const categoryEntries = Object.entries(t('categories', { returnObjects: true }) as Record<string, string>);
      
      // Normalize the category from URL by removing accents and special characters
      const normalizedCategoryParam = categoryParam.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      
      // Find matching category by comparing normalized versions
      const matchingCategory = categoryEntries.find(([_, englishName]) => {
        const normalizedEnglishName = englishName.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        
        return normalizedEnglishName === normalizedCategoryParam;
      });
      
      if (matchingCategory && availableCategories.includes(matchingCategory[0])) {
        setSelectedCategories([matchingCategory[0]]);
      }
    }
  }, [availableCategories, t]);

  // Update URL when selected category changes
  useEffect(() => {
    const category = selectedCategories.length === 1 ? selectedCategories[0] : null;
    const url = new URL(window.location.href);
    
    if (category) {
      // Use English category names in the URL for better sharing
      let englishCategory = t(`categories.${category}`);
      
      // Remove accents and special characters for better URL compatibility
      englishCategory = englishCategory
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")  // Remove accents
        .replace(/[^\w\s-]/g, "")         // Remove special characters
        .trim();
      
      url.searchParams.set('category', englishCategory);
    } else {
      url.searchParams.delete('category');
    }
    
    // Update browser URL without reloading the page
    window.history.replaceState({}, '', url);
  }, [selectedCategories, t]);

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
      
      // Make sure "Planejado" category is always included
      if (!activeCategories.includes("Planejado")) {
        activeCategories.push("Planejado");
      }
      
      // Make sure "Internacional" category is always included if there are non-Brazilian apps
      if (!activeCategories.includes("Internacional")) {
        const hasInternationalApps = apps.some(app => app.country && app.country !== "Brasil");
        if (hasInternationalApps) {
          activeCategories.push("Internacional");
        }
      }
      
      // Filter the category data to include categories with apps and also ensure special categories are present
      const filteredCategoryNames = categoriesData
        .map((cat: any) => cat.name)
        .filter((name: string) => activeCategories.includes(name));
      
      // Make sure we include all active categories, even if not in Airtable data
      const allCategories = Array.from(new Set([...filteredCategoryNames, ...activeCategories]));
      
      setAvailableCategories(allCategories);
      
      // Create a map of category names to their icon URLs
      const iconMap: Record<string, string> = {};
      categoriesData.forEach((cat: any) => {
        // Include "Todos" category icon regardless of active status
        if (cat.name === "Todos" && cat.iconUrl) {
          iconMap[cat.name] = cat.iconUrl;
        }
        // For other categories, only include if they have apps
        else if (cat.name && cat.iconUrl && activeCategories.includes(cat.name)) {
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
      
      // Make sure "Planejado" category is always included
      if (!activeCategories.includes("Planejado")) {
        activeCategories.push("Planejado");
      }
      
      // Make sure "Internacional" category is always included if there are non-Brazilian apps
      if (!activeCategories.includes("Internacional")) {
        const hasInternationalApps = apps.some(app => app.country && app.country !== "Brasil");
        if (hasInternationalApps) {
          activeCategories.push("Internacional");
        }
      }
      
      // Use all active categories instead of a predefined list
      const predefinedCategories = activeCategories;
      
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
      case "Trabalho":
        return <span className="inline-block w-full h-full">💼</span>;
      case "Trabalhos":
        return <span className="inline-block w-full h-full">💼</span>;
      // Removed Mobilidade category as requested
      case "Segurança":
        return <span className="inline-block w-full h-full">🔒</span>;
      case "Internacional":
        return <span className="inline-block w-full h-full">🌍</span>;
      case "Planejado":
        return <span className="inline-block w-full h-full">🕒</span>;
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
    // Removed Mobilidade category as requested
    if (app.category === "Planejado") return "Planejado"; // Include Planejado category
    
    // Status-based categorization
    if (app.status === "Planejado") return "Planejado";
    
    // Country-based categorization for international apps
    if (app.country && app.country !== "Brasil") {
      // For Finnish apps in the screenshot
      if (app.country === "Finlândia") return "Internacional";
      // For Estonian apps in the screenshot
      if (app.country === "Estônia") return "Internacional";
      // For UK apps in the screenshot
      if (app.country === "Reino Unido") return "Internacional";
      // Return "Internacional" for any non-Brazilian app
      return "Internacional";
    }
    
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
    if (app.name === "GOV.UK") {
      // Mark GOV.UK as a planned app
      app.status = "Planejado";
      return "Planejado";
    }
    if (app.name === "Kela" || app.name === "Suomi.fi" || app.name === "Kanta") {
      // Mark Finnish apps as planned
      app.status = "Planejado";
      return "Planejado";
    }
    if (app.name === "Eesti.ee" || app.name === "e-Residency") {
      // Mark Estonian apps as planned
      app.status = "Planejado";
      return "Planejado";
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
      
      // Special handling for Planejado category
      if (selectedCategories.includes("Planejado")) {
        // Check if this app should be categorized as Planejado
        // Look for "Planejado" in various places
        if (
          // Check direct status field
          app.status === "Planejado" || 
          // Check category field
          app.category === "Planejado" ||
          // Check categories array
          (app.categories && Array.isArray(app.categories) && app.categories.includes("Planejado")) ||
          // Mark international apps from specific countries as Planejado
          (app.name && (
            app.name === "GOV.UK" || 
            app.name === "Kela" || 
            app.name === "Suomi.fi" || 
            app.name === "Kanta" ||
            app.name === "Eesti.ee" || 
            app.name === "e-Residency" ||
            app.name === "Smart-ID" ||
            app.name === "Autenticação Gov" ||
            app.name === "SNS 24" ||
            app.name === "IRISbox" ||
            app.name === "my eBox" ||
            app.name === "NHS" ||
            app.name === "MEI" ||
            app.name === "Zona Azul Digital Recife"
          ))
        ) {
          // Set the app's status to Planejado for consistency
          app.status = "Planejado";
          return true;
        }
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
    
    // Final step: Always move Planejado apps to the end, regardless of other sorting
    filtered = [...filtered].sort((a, b) => {
      // More comprehensive check for "Planejado" status 
      const aIsPlanned = 
        a.status === "Planejado" || 
        a.category === "Planejado" ||
        // Include the specific list of international apps that should be marked as planned
        (a.name && [
          "GOV.UK", "Kela", "Suomi.fi", "Kanta", "Eesti.ee", "e-Residency",
          "Smart-ID", "Autenticação Gov", "SNS 24", "IRISbox", "my eBox",
          "NHS", "MEI", "Zona Azul Digital Recife"
        ].includes(a.name));
      
      const bIsPlanned = 
        b.status === "Planejado" || 
        b.category === "Planejado" ||
        // Include the specific list of international apps that should be marked as planned 
        (b.name && [
          "GOV.UK", "Kela", "Suomi.fi", "Kanta", "Eesti.ee", "e-Residency",
          "Smart-ID", "Autenticação Gov", "SNS 24", "IRISbox", "my eBox",
          "NHS", "MEI", "Zona Azul Digital Recife"
        ].includes(b.name));
      
      // If a is planned and b is not, a comes after b
      if (aIsPlanned && !bIsPlanned) return 1;
      // If a is not planned and b is, a comes before b
      if (!aIsPlanned && bIsPlanned) return -1;
      // If both are planned or both are not planned, maintain their current order
      return 0;
    });
    
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
                    {getCategoryIcon("Todos")}
                  </div>
                  <span>{t('filters.all')}</span>
                  {selectedCategories.length === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                  )}
                </button>
                
                {availableCategories && availableCategories
                  .filter(category => category !== "Mobilidade") // Filter out Mobilidade category
                  .map((category, index) => (
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
                    <span>{t(`categories.${category}`)}</span>
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
          
          {/* App counter and share button */}
          <div className="flex gap-4 items-center">
            {selectedCategories.length === 1 && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setShowShareTooltip(true);
                  setTimeout(() => setShowShareTooltip(false), 2000);
                }}
              >
                <Share2 className="h-4 w-4" />
                <span>{t('filters.shareCategory')}</span>
                {showShareTooltip && (
                  <div className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded">
                    {t('filters.linkCopied')}
                  </div>
                )}
              </Button>
            )}
            <div className="text-gray-600 font-medium flex flex-col items-end">
              <span>{t('filters.showing')}</span>
              <span className="font-semibold">{filteredApps?.length || 0} {t('header.apps').toLowerCase()}</span>
            </div>
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
