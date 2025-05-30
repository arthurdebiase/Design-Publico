// App types
export type AppType = 'Federal' | 'Municipal' | 'State' | '';
export type Platform = 'iOS' | 'Android' | 'Web' | 'Cross-platform' | '';

// Category with icon attachment
export interface Category {
  id: string;
  name: string;
  iconUrl?: string; // URL for the category icon from Airtable attachments
}

export interface App {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  logo?: string;
  cloudinaryLogo?: string; // Cloudinary URL for the app logo - more reliable than Airtable URLs
  type: AppType;
  category: string | string[];
  platform: Platform;
  language?: string;
  screenCount: number;
  url?: string;
  status?: string; // "Publicado" or "Planejado"
  country?: string; // Country where the app is from, default is "Brasil"
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
  cloudinaryUrl?: string; // URL from Cloudinary for reliable image hosting
  altText?: string;   // Alt text for image accessibility
  flow?: string;
  order: number;
  tags?: string[];
  category?: string | string[];
  airtableId: string;  // Airtable record ID for more stable links
  createdAt: string;
  updatedAt: string;
}
