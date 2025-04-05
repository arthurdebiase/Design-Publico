import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { App } from "@/types";

interface AppCardProps {
  app: App;
}

export default function AppCard({ app }: AppCardProps) {
  return (
    <Link href={`/app/${app.id}`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer">
        <div className="relative">
          <img 
            src={app.thumbnailUrl} 
            alt={`${app.name} App`} 
            className="w-full aspect-[3/2] object-cover"
          />
          {/* Federal tag removed */}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 flex-shrink-0 rounded-lg border border-gray-200 flex items-center justify-center">
              {app.logo ? (
                <img 
                  src={app.logo} 
                  alt={`${app.name} Logo`} 
                  className="w-6 h-6"
                />
              ) : (
                <LogoPlaceholder app={app} />
              )}
            </div>
            <div>
              <h3 className="font-medium text-[#333333]">{app.name}</h3>
              <p className="text-sm text-gray-500">{app.category}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{app.screenCount} screens</span>
            <Badge variant="outline" className={`text-xs px-2 py-1 ${getPlatformBadgeClass(app.platform)}`}>
              {app.platform}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}

function truncateDescription(description: string, maxLength: number = 80): string {
  if (description.length <= maxLength) return description;
  return description.slice(0, maxLength) + '...';
}

function LogoPlaceholder({ app }: { app: App }) {
  const getIconByCategory = () => {
    switch (app.category) {
      case 'Healthcare':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-600">
            <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
          </svg>
        );
      case 'Finance':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-600">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
        );
      case 'Government':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-600">
            <path d="M2 20h20"></path>
            <path d="M12 4L2 9h20L12 4z"></path>
            <path d="M12 4v16"></path>
            <path d="M8 9v11"></path>
            <path d="M16 9v11"></path>
          </svg>
        );
      default:
        return (
          <div className="text-gray-600 font-bold">{app.name.charAt(0)}</div>
        );
    }
  };
  
  return getIconByCategory();
}

function getBadgeColorClass(type: string): string {
  switch (type) {
    case 'Federal':
      return 'bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded';
    case 'Municipal':
      return 'bg-teal-100 text-teal-800 text-xs font-medium px-2 py-1 rounded';
    case 'State':
      return 'bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded';
    default:
      return 'bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded';
  }
}

function getLogoBackgroundClass(type: string): string {
  switch (type) {
    case 'Federal':
      return 'bg-blue-500';
    case 'Municipal':
      return 'bg-teal-500';
    case 'State':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
}

function getPlatformBadgeClass(platform: string): string {
  switch (platform) {
    case 'iOS':
      return 'bg-blue-50 text-blue-600';
    case 'Android':
      return 'bg-green-50 text-green-600';
    case 'Web':
      return 'bg-orange-50 text-orange-600';
    case 'Cross-platform':
      return 'bg-purple-50 text-purple-600';
    default:
      return 'bg-gray-50 text-gray-600';
  }
}
