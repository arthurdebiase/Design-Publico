import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Layers, Monitor, Tag, Smartphone, FolderTree } from "lucide-react";
import { App, Screen } from "@/types";
import { useEffect, useState } from "react";

export default function About() {
  const { t } = useTranslation();
  const [totalTags, setTotalTags] = useState<number>(0);
  const [totalCategories, setTotalCategories] = useState<number>(0);

  // Fetch all apps to count them and their screens
  const { data: apps = [] } = useQuery<App[]>({
    queryKey: ['/api/apps'],
    // The QueryClient default settings will handle the request
  });

  // Calculate total screens across all apps
  const totalScreens = apps.reduce((sum, app) => sum + app.screenCount, 0);
  const totalApps = apps.length;
  
  // Calculate unique tags and categories
  useEffect(() => {
    const fetchData = async () => {
      if (!apps.length) return;
      
      const tags = new Set<string>();
      const categories = new Set<string>();
      
      // For each app, fetch its screens
      for (const app of apps) {
        try {
          const screensResponse = await fetch(`/api/apps/${app.id}/screens`);
          const appScreens = await screensResponse.json() as Screen[];
          
          if (Array.isArray(appScreens)) {
            // Extract tags
            appScreens.forEach(screen => {
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
            });
          }
        } catch (error) {
          console.error(`Error fetching screens for app ${app.id}:`, error);
        }
      }
      
      // Add app categories too
      apps.forEach(app => {
        if (app.category) {
          if (typeof app.category === 'string' && app.category.trim()) {
            categories.add(app.category.trim());
          } else if (Array.isArray(app.category)) {
            app.category.forEach(cat => {
              if (cat && typeof cat === 'string' && cat.trim()) {
                categories.add(cat.trim());
              }
            });
          }
        }
      });
      
      setTotalTags(tags.size);
      setTotalCategories(categories.size);
    };
    
    fetchData();
  }, [apps]);

  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('about.title')}</h1>
            <p className="text-xl text-gray-600 mb-12">
              {t('about.description')}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <div className="bg-gray-50 p-8 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
                <div className="bg-blue-100 p-4 rounded-full mb-4">
                  <Monitor className="h-8 w-8 text-[#0066FF]" />
                </div>
                <span className="text-4xl font-bold mb-2">{totalApps}</span>
                <p className="text-gray-600">{t('about.stats.apps')}</p>
              </div>
              
              <div className="bg-gray-50 p-8 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
                <div className="bg-blue-100 p-4 rounded-full mb-4">
                  <Layers className="h-8 w-8 text-[#0066FF]" />
                </div>
                <span className="text-4xl font-bold mb-2">{totalScreens}</span>
                <p className="text-gray-600">{t('about.stats.screens')}</p>
              </div>

              <div className="bg-gray-50 p-8 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                  <Tag className="h-8 w-8 text-[#0066FF]" />
                </div>
                <span className="text-4xl font-bold mb-2">{totalTags}</span>
                <p className="text-gray-600">{t('about.stats.tags')}</p>
              </div>
              
              <div className="bg-gray-50 p-8 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
                <div className="bg-purple-100 p-4 rounded-full mb-4">
                  <FolderTree className="h-8 w-8 text-[#0066FF]" />
                </div>
                <span className="text-4xl font-bold mb-2">{totalCategories}</span>
                <p className="text-gray-600">{t('about.stats.categories')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}