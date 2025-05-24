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
  
  // Extract available categories from apps and set predefined categories
  useEffect(() => {
    if (apps && apps.length > 0) {
      // Predefined categories that we want to display
      const predefinedCategories = ["Cidadania", "Finanças", "Logística", "Portal", "Saúde", "Trabalho"];
      setAvailableCategories(predefinedCategories);
      
      // Log categories
      console.log("Available categories:", predefinedCategories);
    }
  }, [apps]);
  
  // Function to get app categories is implemented below
  
  // Get the categories for an app, using the 'categories' array field if available
  const getAppCategories = (app: any): string[] => {
    if (!app) return ["Portal"];
    
    // Use the 'categories' array field if available
    if (app.categories && Array.isArray(app.categories) && app.categories.length > 0) {
      return app.categories;
    }
    
    // Fallback to 'category' field if categories is not available
    if (app.category) {
      return [app.category];
    }
    
    // Fallback based on app name
    if (app.name.includes("CAIXA") || app.name.includes("INSS") || app.name.includes("Tesouro")) {
      return ["Finanças"];
    }
    if (app.name.includes("Trabalho")) {
      return ["Trabalho"];
    }
    if (app.name.includes("SUS") || app.name.includes("Saúde")) {
      return ["Saúde"];
    }
    if (app.name.includes("Correios")) {
      return ["Logística"];
    }
    if (app.name.includes("Título") || app.name.includes("Cidadania")) {
      return ["Cidadania"];
    }
    
    // Fallback to default
    return ["Portal"];
  };
  
  // Helper function to get the primary category for an app
  const getPrimaryCategory = (app: any): string => {
    const categories = getAppCategories(app);
    return categories[0] || "Portal";
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
      
      // Get the app categories 
      const appCategories = getAppCategories(app);
      
      // Check if any of the app's categories match the selected categories
      return selectedCategories.some(category => appCategories.includes(category));
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
          <div className="overflow-x-auto pb-2">
            <div className="flex space-x-1 min-w-max">
              <button
                onClick={() => setSelectedCategories([])}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategories.length === 0 
                    ? 'text-green-600 font-semibold' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
                aria-label={t('filters.all')}
              >
                <span className="inline-block w-5 h-5 mr-1">🏠</span>
                {t('filters.all')}
                {selectedCategories.length === 0 && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-sm"></div>
                )}
              </button>
              
              {availableCategories && availableCategories.map((category, index) => (
                <button
                  key={`tab-${index}-${category}`}
                  onClick={() => handleCategoryFilterChange(category)}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategories.includes(category) 
                      ? 'text-green-600 font-semibold' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                  aria-label={category}
                >
                  {/* Category icons */}
                  {category === "Cidadania" && <span className="inline-block w-5 h-5 mr-1">👤</span>}
                  {category === "Finanças" && <span className="inline-block w-5 h-5 mr-1">💰</span>}
                  {category === "Logística" && <span className="inline-block w-5 h-5 mr-1">🚚</span>}
                  {category === "Portal" && <span className="inline-block w-5 h-5 mr-1">🌐</span>}
                  {category === "Saúde" && <span className="inline-block w-5 h-5 mr-1">❤️</span>}
                  {category === "Trabalho" && <span className="inline-block w-5 h-5 mr-1">💼</span>}
                  {category === "Mobilidade" && <span className="inline-block w-5 h-5 mr-1">🚗</span>}
                  {category === "Segurança" && <span className="inline-block w-5 h-5 mr-1">🔒</span>}
                  
                  {category}
                  {selectedCategories.includes(category) && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-sm"></div>
                  )}
                </button>
              ))}
            </div>
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
