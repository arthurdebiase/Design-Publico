import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Loader2 } from 'lucide-react';
import { Screen } from '@/types';
import { Button } from '@/components/ui/button';

export default function ScreensPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchAllScreens = async () => {
      setLoading(true);
      try {
        // Fetch all apps
        const appsResponse = await fetch('/api/apps');
        const apps = await appsResponse.json();
        
        if (!Array.isArray(apps)) {
          throw new Error('Invalid response format from API');
        }
        
        // For each app, fetch its screens
        const allScreens: Screen[] = [];
        
        for (const app of apps) {
          const screensResponse = await fetch(`/api/apps/${app.id}/screens`);
          const appScreens = await screensResponse.json();
          
          if (Array.isArray(appScreens)) {
            // Add app information to each screen for display
            const screensWithAppInfo = appScreens.map(screen => ({
              ...screen,
              appName: app.name,
              appId: app.id
            }));
            
            allScreens.push(...screensWithAppInfo);
          }
        }
        
        // Sort all screens by most recent
        const sortedScreens = allScreens.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setScreens(sortedScreens);
      } catch (err) {
        console.error('Error fetching screens:', err);
        setError('Failed to load screens. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllScreens();
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 text-[#0066FF] animate-spin mb-4" />
        <p className="text-lg text-gray-600">Loading screens...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="p-6 bg-red-50 rounded-lg max-w-md">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 md:px-6 pt-10 pb-0">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">All Screens</h1>
        <p className="text-gray-600">
          Browse all {screens.length} screens from our design gallery
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {screens.map((screen) => (
          <ScreenCard key={screen.id} screen={screen} />
        ))}
      </div>
    </div>
  );
}

interface ScreenCardProps {
  screen: Screen & { appName?: string };
}

function ScreenCard({ screen }: ScreenCardProps) {
  return (
    <Link href={`/app/${screen.appId}`}>
      <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white border border-gray-200 h-full flex flex-col">
        <div className="relative">
          <img 
            src={screen.imageUrl} 
            alt={screen.name || 'App screen'} 
            className="w-full aspect-[9/16] object-cover object-top"
          />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-semibold text-[#333333] line-clamp-1 mb-1">
            {screen.name || 'Untitled Screen'}
          </h3>
          {screen.appName && (
            <p className="text-sm text-gray-500 mb-2">
              From {screen.appName}
            </p>
          )}
          {screen.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-auto">
              {screen.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}