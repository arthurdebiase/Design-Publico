import { apiRequest } from "./queryClient";
import { App, Screen, AppType, Platform } from "@/types";

/**
 * Fetch a list of all apps, optionally filtered
 * 
 * @param filters Optional filters for app type, platform, and search
 * @returns A promise resolving to an array of App objects
 */
export async function fetchApps(filters?: {
  type?: AppType;
  platform?: Platform;
  search?: string;
}): Promise<App[]> {
  try {
    let url = "/api/apps";

    if (filters) {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.platform) params.append("platform", filters.platform);
      if (filters.search) params.append("search", filters.search);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    // Add a timestamp to prevent caching issues in production
    const cacheBuster = new URLSearchParams();
    cacheBuster.append("_t", Date.now().toString());
    url += url.includes('?') ? `&${cacheBuster.toString()}` : `?${cacheBuster.toString()}`;

    // Use a longer timeout for the fetch operation (10 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      credentials: "include",
      signal: controller.signal,
      // Add headers to prevent caching
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch apps: ${response.statusText}`);
    }

    const apps = await response.json();
    
    // Log how many apps were loaded
    console.log(`Successfully loaded ${apps.length} apps from API`);
    
    // Sort apps alphabetically by name
    return apps.sort((a: App, b: App) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching apps:", error);
    // Return an empty array instead of throwing to prevent UI breakage
    return [];
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
    // Add cache busting parameter to prevent caching issues
    const url = `/api/apps/${appId}/screens?_t=${Date.now()}`;
    
    // Use a longer timeout for the fetch operation (10 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      credentials: "include",
      signal: controller.signal,
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch screens: ${response.statusText}`);
    }

    const screens = await response.json();
    
    // Log success for debugging
    console.log(`Successfully loaded ${screens.length} screens for app ID ${appId}`);
    
    // Sort screens by their order field from Airtable
    return screens.sort((a: Screen, b: Screen) => a.order - b.order);
  } catch (error) {
    console.error(`Error fetching screens for app with ID ${appId}:`, error);
    // Return empty array instead of throwing to prevent UI breakage
    return [];
  }
}
