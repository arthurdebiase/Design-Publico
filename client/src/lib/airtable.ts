import { apiRequest } from "./queryClient";
import { App, Screen, AppType, Platform, AppCategory } from "@/types";

/**
 * Fetch a list of all apps, optionally filtered
 * 
 * @param filters Optional filters for app type, platform, and search
 * @returns A promise resolving to an array of App objects
 */
export async function fetchApps(filters?: {
  type?: AppType;
  platform?: Platform;
  category?: AppCategory;
  name?: string;
  search?: string;
}): Promise<App[]> {
  try {
    let url = "/api/apps";

    if (filters) {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.platform) params.append("platform", filters.platform);
      if (filters.category) params.append("category", filters.category);
      if (filters.name) params.append("name", filters.name);
      if (filters.search) params.append("search", filters.search);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    const response = await fetch(url, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch apps: ${response.statusText}`);
    }

    const apps = await response.json();
    
    // Sort apps alphabetically by name
    return apps.sort((a: App, b: App) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching apps:", error);
    throw error;
  }
}

/**
 * Fetch a single app by its ID
 * 
 * @param id The ID of the app to fetch
 * @returns A promise resolving to an App object
 */
export async function fetchAppById(id: string): Promise<App> {
  try {
    const response = await fetch(`/api/apps/${id}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch app: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching app with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Fetch all screens for a specific app
 * 
 * @param appId The ID of the app whose screens should be fetched
 * @returns A promise resolving to an array of Screen objects
 */
export async function fetchScreensByAppId(appId: string): Promise<Screen[]> {
  try {
    const response = await fetch(`/api/apps/${appId}/screens`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch screens: ${response.statusText}`);
    }

    const screens = await response.json();
    
    // Sort screens by their order field to ensure consistent display
    // This ensures the splash screen (typically order=0 or order=1) appears first
    return screens.sort((a: Screen, b: Screen) => {
      // Primary sort by order
      return a.order - b.order;
    });
  } catch (error) {
    console.error(`Error fetching screens for app with ID ${appId}:`, error);
    throw error;
  }
}
