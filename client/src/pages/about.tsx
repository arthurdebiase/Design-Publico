import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Layers, Monitor, Tag, Smartphone, FolderTree } from "lucide-react";
import { App, Screen } from "@/types";
import { useEffect, useState, useRef, createContext, useContext } from "react";

// Create a context to share the animation state
const AnimationContext = createContext<boolean>(false);

interface CounterAnimationProps {
  end: number;
  duration?: number;
  className?: string;
}

function CounterAnimation({ end, duration = 1000, className = "" }: CounterAnimationProps) {
  const [count, setCount] = useState(0);
  const shouldAnimate = useContext(AnimationContext);
  
  useEffect(() => {
    // Return early if animation should not start yet, or if end value is 0
    if (!shouldAnimate || end === 0) return;
    
    // Short-circuit to end value if it's very small
    if (end < 5) {
      setCount(end);
      return;
    }
    
    // Use a fixed start time for all animations
    const startTime = performance.now();
    
    const step = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easeOutExpo for faster start and smooth finish
      const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const easedProgress = easeOutExpo(progress);
      
      setCount(Math.floor(easedProgress * end));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    // Start animation immediately
    window.requestAnimationFrame(step);
  }, [end, duration, shouldAnimate]);
  
  // Format number with thousand separators for better readability
  const formattedCount = count.toLocaleString();
  
  return <span className={className}>{formattedCount}</span>;
}

export default function About() {
  const { t } = useTranslation();
  const [totalTags, setTotalTags] = useState<number>(0);
  const [totalCategories, setTotalCategories] = useState<number>(0);
  const [totalScreens, setTotalScreens] = useState<number>(0);
  const [shouldAnimate, setShouldAnimate] = useState<boolean>(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fetch all apps to count them and their screens
  const { data: apps = [] } = useQuery<App[]>({
    queryKey: ['/api/apps'],
    // The QueryClient default settings will handle the request
  });

  const totalApps = apps.length;
  
  // Set up intersection observer for the stats section
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setShouldAnimate(true);
        // Once animation is triggered, we can disconnect the observer
        observerRef.current?.disconnect();
      }
    }, { threshold: 0.1 });

    if (statsRef.current) {
      observerRef.current.observe(statsRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  
  // Calculate total screens, unique tags and categories - optimized to fetch in parallel
  useEffect(() => {
    const fetchData = async () => {
      if (!apps.length) return;
      
      const tags = new Set<string>();
      const categories = new Set<string>();
      let screenCount = 0;
      
      // Pre-fetch all app categories
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

      try {
        // Fetch all screens in parallel instead of sequentially
        const fetchPromises = apps.map(app => 
          fetch(`/api/apps/${app.id}/screens`)
            .then(res => res.json())
            .catch(err => {
              console.error(`Error fetching screens for app ${app.id}:`, err);
              return []; // Return empty array on error
            })
        );
        
        // Wait for all fetches to complete
        const allScreensData = await Promise.all(fetchPromises);
        
        // Process all screen data at once
        allScreensData.forEach(appScreens => {
          if (Array.isArray(appScreens)) {
            // Count screens
            screenCount += appScreens.length;
            
            // Extract tags & categories
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
        });
        
        // Update all state values at once
        setTotalScreens(screenCount);
        setTotalTags(tags.size);
        setTotalCategories(categories.size);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      }
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
            <AnimationContext.Provider value={shouldAnimate}>
              <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="bg-gray-50 p-8 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
                  <div className="bg-[#00944026] p-4 rounded-full mb-4">
                    <Monitor className="h-8 w-8 text-[#009440]" />
                  </div>
                  <CounterAnimation end={totalApps} className="text-4xl font-bold mb-2" />
                  <p className="text-gray-600">{t('about.stats.apps')}</p>
                </div>
                
                <div className="bg-gray-50 p-8 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
                  <div className="bg-[#00944026] p-4 rounded-full mb-4">
                    <Layers className="h-8 w-8 text-[#009440]" />
                  </div>
                  <CounterAnimation end={totalScreens} className="text-4xl font-bold mb-2" />
                  <p className="text-gray-600">{t('about.stats.screens')}</p>
                </div>

                <div className="bg-gray-50 p-8 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
                  <div className="bg-[#00944026] p-4 rounded-full mb-4">
                    <Tag className="h-8 w-8 text-[#009440]" />
                  </div>
                  <CounterAnimation end={totalTags} className="text-4xl font-bold mb-2" />
                  <p className="text-gray-600">{t('about.stats.tags')}</p>
                </div>
                
                <div className="bg-gray-50 p-8 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
                  <div className="bg-[#00944026] p-4 rounded-full mb-4">
                    <FolderTree className="h-8 w-8 text-[#009440]" />
                  </div>
                  <CounterAnimation end={totalCategories} className="text-4xl font-bold mb-2" />
                  <p className="text-gray-600">{t('about.stats.categories')}</p>
                </div>
              </div>
            </AnimationContext.Provider>
          </div>
        </div>
      </section>
    </div>
  );
}