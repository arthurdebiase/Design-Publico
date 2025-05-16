import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApps } from "@/lib/airtable";
import AppCard from "@/components/app-card";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, X } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  const { isLoading, error, data: apps } = useQuery({
    queryKey: ['/api/apps'],
    queryFn: () => fetchApps({})
  });
  
  // Extract available categories from apps
  useEffect(() => {
    if (apps) {
      const categoriesSet = new Set<string>();
      
      // Safely extract categories
      apps.forEach(app => {
        if (app.category && typeof app.category === 'string') {
          categoriesSet.add(app.category);
        }
      });
      
      const sortedCategories = Array.from(categoriesSet).sort();
      setAvailableCategories(sortedCategories);
      
      // Log categories for debugging
      console.log("Available categories:", sortedCategories);
    }
  }, [apps]);
  
  // Filter apps based on selected categories
  const filteredApps = apps?.filter(app => {
    // Check if category matches filter criteria
    const categoryMatch = selectedCategories.length === 0 || 
                         (app.category && 
                          typeof app.category === 'string' && 
                          selectedCategories.includes(app.category));
    
    return categoryMatch;
  });
  
  // Handle category filter change
  const handleCategoryFilterChange = (category: string | null) => {
    if (category === null) {
      setSelectedCategories([]);
    } else if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  // Handle remove category
  const handleRemoveCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== category));
  };
  
  return (
    <div>
      <div className="container mx-auto px-4 md:px-6 pt-6 pb-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Aplicativos</h1>
        </div>
        
        {/* Filter section */}
        <div className="mb-4 flex flex-wrap items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Category filter dropdown */}
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    aria-label="Filtrar por categoria"
                    aria-haspopup="true"
                  >
                    {'Categoria'}
                    <ChevronDown className="h-4 w-4 ml-2" aria-hidden="true" />
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
                  {availableCategories && availableCategories.map((category: string, index: number) => (
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
          
          {/* App counter */}
          <div className="text-gray-600 font-medium">
            Mostrando {filteredApps?.length || 0} de {apps?.length || 0} {(apps?.length || 0) === 1 ? 'aplicativo' : 'aplicativos'}
          </div>
        </div>
        
        {/* Active filter chips */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
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
            {selectedCategories.length > 1 && (
              <button
                onClick={() => {
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
              
              {filteredApps && filteredApps.length === 0 && (
                <div className="bg-white p-8 rounded-lg text-center">
                  <h3 className="font-medium text-lg mb-2">No applications found</h3>
                  <p className="text-gray-500">Try adjusting your filters to see more results.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
