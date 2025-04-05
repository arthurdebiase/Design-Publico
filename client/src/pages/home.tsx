import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApps } from "@/lib/airtable";
import { ResponsiveMasonryGrid } from "@/components/ui/masonry-grid";
import AppCard from "@/components/app-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [layout, setLayout] = useState<"grid" | "masonry">("masonry");
  
  const { isLoading, error, data: apps } = useQuery({
    queryKey: ['/api/apps'],
    queryFn: () => fetchApps({})
  });
  
  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      <div className="container mx-auto px-4 md:px-6 py-6">
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
                  {apps && apps.map(app => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </ResponsiveMasonryGrid>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {apps && apps.map(app => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              )}
              
              {apps && apps.length === 0 && (
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
