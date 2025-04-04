import { apiRequest } from "./queryClient";
import { App, Screen, AppType, Platform } from "@/types";

// Fetching applications from Airtable via our backend
export async function fetchApps(filters?: {
  type?: AppType;
  platform?: Platform;
  search?: string;
}): Promise<App[]> {
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

  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch apps: ${response.statusText}`);
  }

  return await response.json();
}

// Fetch a single app by ID
export async function fetchAppById(id: string): Promise<App> {
  const response = await fetch(`/api/apps/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch app: ${response.statusText}`);
  }

  return await response.json();
}

// Fetch screens for a specific app
export async function fetchScreensByAppId(appId: string): Promise<Screen[]> {
  const response = await fetch(`/api/apps/${appId}/screens`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch screens: ${response.statusText}`);
  }

  return await response.json();
}
