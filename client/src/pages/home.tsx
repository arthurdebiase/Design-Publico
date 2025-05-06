import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApps } from "@/lib/airtable";
import { ResponsiveMasonryGrid } from "@/components/ui/masonry-grid";
import AppCard from "@/components/app-card";
import { Skeleton } from "@/components/ui/skeleton";
import FilterBar from "@/components/layout/filter-bar";
import { AppType, Platform, AppCategory } from "@/types";

export default function Home() {
  const [layout, setLayout] = useState<"grid" | "masonry">("masonry");
  const [sortOrder, setSortOrder] = useState<string>("name_asc");
  const [filters, setFilters] = useState<{
    type?: AppType;
    platform?: Platform;
    category?: AppCategory;
    tag?: string;
  }>({});
  
  const { isLoading, error, data: apps, refetch } = useQuery({
    queryKey: ['/api/apps', filters],
    queryFn: () => fetchApps(filters)
  });
  
  // Refetch when filters change
  useEffect(() => {
    refetch();
  }, [filters, refetch]);
  
  // Handle filter changes from the filter bar
  const handleFilterChange = (newFilters: {
    type?: AppType;
    platform?: Platform;
    category?: AppCategory;
    tag?: string;
  }) => {
    setFilters(newFilters);
  };
  
  // Handle sort order changes
  const handleSortChange = (sort: string) => {
    setSortOrder(sort);
  };
  
  // Sort apps based on selected sort order
  const sortedApps = apps ? [...apps].sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'screens_desc':
        return b.screenCount - a.screenCount;
      default:
        return 0;
    }
  }) : [];
  
  return (
    <div>
      <FilterBar 
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onLayoutChange={setLayout}
        activeFilters={filters}
        activeLayout={layout}
      />
      
      <div className="container mx-auto px-4 md:px-6 pt-6 pb-0">
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
              {layout === "masonry" ? (
                <ResponsiveMasonryGrid>
                  {sortedApps.map(app => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </ResponsiveMasonryGrid>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedApps.map(app => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              )}
              
              {sortedApps.length === 0 && (
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
