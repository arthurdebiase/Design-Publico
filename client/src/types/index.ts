// App types
export type AppType = 'Federal' | 'Municipal' | 'State' | '';
export type Platform = 'iOS' | 'Android' | 'Web' | 'Cross-platform' | '';

export interface App {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  logo?: string;
  type: AppType;
  category: string | string[];
  platform: Platform;
  language?: string;
  screenCount: number;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

// Screen types
export interface Screen {
  id: string;
  appId: string;
  name: string;
  description: string;
  imageUrl: string;
  flow?: string;
  order: number;
  tags?: string[];
  category?: string | string[];
  createdAt: string;
  updatedAt: string;
}
