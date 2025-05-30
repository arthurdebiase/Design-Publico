import { 
  App, InsertApp, 
  Screen, InsertScreen,
  apps as appsTable,
  screens as screensTable
} from "@shared/schema";
import axios from "axios";
import { idObfuscator } from "./id-obfuscator";

// Interface for storage operations
export interface IStorage {
  // Apps
  getApps(filters?: { type?: string; platform?: string; search?: string }): Promise<App[]>;
  getAppById(id: number): Promise<App | undefined>;
  getAppBySlug(slug: string): Promise<App | undefined>;
  createApp(app: InsertApp): Promise<App>;

  // Screens
  getScreensByAppId(appId: number): Promise<Screen[]>;
  createScreen(screen: InsertScreen): Promise<Screen>;

  // Categories
  getCategories(): Promise<any[]>; // Will return categories with their icon attachments

  // Brand
  getBrandLogo(): Promise<string | null>;

  // Airtable Sync
  syncFromAirtable(apiKey: string, baseId: string): Promise<void>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private apps: Map<number, App>;
  private screens: Map<number, Screen>;
  private appIdCounter: number;
  private screenIdCounter: number;
  
  // Fix for TypeScript errors with new schema fields
  private migrateLegacyApp(app: any): App {
    // Add missing fields from schema updates
    if (!('slug' in app)) {
      app.slug = app.name ? this.createSlugFromName(app.name) : null;
    }
    return app as App;
  }
  
  private migrateLegacyScreen(screen: any): Screen {
    // Add missing fields from schema updates
    if (!('cloudinaryUrl' in screen)) {
      screen.cloudinaryUrl = null;
    }
    
    // Ensure other nullable fields have proper values
    if (!('altText' in screen) || screen.altText === undefined) {
      screen.altText = null;
    }
    
    if (!('flow' in screen) || screen.flow === undefined) {
      screen.flow = null;
    }
    
    if (!('category' in screen) || screen.category === undefined) {
      screen.category = null;
    }
    
    if (!('tags' in screen) || screen.tags === undefined) {
      screen.tags = null;
    }
    
    return screen as Screen;
  }

  constructor() {
    this.apps = new Map();
    this.screens = new Map();
    this.appIdCounter = 1;
    this.screenIdCounter = 1;

    // Initialize with sample data
    this.initializeSampleData();
  }

  // Apps
  async getApps(filters?: { type?: string; platform?: string; search?: string }): Promise<App[]> {
    let result = Array.from(this.apps.values());
    
    // Filter out apps with "Hide" status
    result = result.filter(app => {
      // Cast status to string or use undefined if not present
      const appStatus = app.status as string | undefined;
      return appStatus !== "Hide";
    });

    if (filters) {
      if (filters.type) {
        result = result.filter(app => app.type === filters.type);
      }

      if (filters.platform) {
        result = result.filter(app => app.platform === filters.platform);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(app => 
          app.name.toLowerCase().includes(searchLower) || 
          app.description.toLowerCase().includes(searchLower) ||
          app.category.toLowerCase().includes(searchLower)
        );
      }
    }

    // Remove internal Airtable record IDs completely from API responses for security
    return result.map(app => {
      const { airtableId, ...appWithoutInternalId } = app;
      return appWithoutInternalId;
    });
  }

  async getAppById(id: number): Promise<App | undefined> {
    return this.apps.get(id);
  }
  
  async getAppBySlug(slug: string): Promise<App | undefined> {
    // Converter o slug para minúsculas para comparação case-insensitive
    const normalizedSlug = slug.toLowerCase();
    
    // Procurar por apps cujo nome convertido em slug corresponda ao slug fornecido
    const apps = Array.from(this.apps.values());
    for (let i = 0; i < apps.length; i++) {
      const app = apps[i];
      const appSlug = this.createSlugFromName(app.name);
      if (appSlug === normalizedSlug) {
        return app;
      }
    }
    
    return undefined;
  }
  
  // Função auxiliar para criar slug a partir do nome do app
  private createSlugFromName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/[\s_]+/g, '-') // Substitui espaços e underscores por hífens
      .replace(/^-+|-+$/g, ''); // Remove hífens extras do início e fim
  }

  async createApp(insertApp: InsertApp): Promise<App> {
    const id = this.appIdCounter++;
    const now = new Date();
    const slug = this.createSlugFromName(insertApp.name);

    // Ensure all required fields have appropriate values
    const app: App = {
      id,
      name: insertApp.name,
      description: insertApp.description,
      thumbnailUrl: insertApp.thumbnailUrl,
      logo: insertApp.logo ?? null,
      cloudinaryLogo: insertApp.cloudinaryLogo ?? null, // Include Cloudinary logo URL
      type: insertApp.type,
      category: insertApp.category,
      platform: insertApp.platform,
      language: insertApp.language ?? null,
      screenCount: insertApp.screenCount ?? 0,
      url: insertApp.url ?? null,
      slug: slug, // Include the slug
      airtableId: insertApp.airtableId,
      createdAt: now,
      updatedAt: now,
    };

    this.apps.set(id, app);
    return app;
  }

  // Screens
  async getScreensByAppId(appId: number): Promise<Screen[]> {
    const result = Array.from(this.screens.values())
      .filter(screen => screen.appId === appId)
      .sort((a, b) => {
        // Special case: always put intro screens first
        if (a.order === -1 && b.order !== -1) return -1;
        if (a.order !== -1 && b.order === -1) return 1;
        
        // Otherwise, use the numeric order
        return a.order - b.order;
      });

    // Remove internal Airtable record IDs completely from API responses for security
    return result.map(screen => {
      const { airtableId, ...screenWithoutInternalId } = screen;
      return screenWithoutInternalId;
    });
  }

  async createScreen(insertScreen: InsertScreen): Promise<Screen> {
    const id = this.screenIdCounter++;
    const now = new Date();

    // Ensure all required fields have appropriate values
    const screen: Screen = {
      id,
      appId: insertScreen.appId,
      name: insertScreen.name,
      description: insertScreen.description ?? null,
      imageUrl: insertScreen.imageUrl,
      cloudinaryUrl: insertScreen.cloudinaryUrl ?? null,
      altText: insertScreen.altText ?? `Screen from ${insertScreen.name}`,
      flow: insertScreen.flow ?? null,
      order: insertScreen.order ?? 0,
      tags: insertScreen.tags ?? null,
      category: insertScreen.category ?? null,
      airtableId: insertScreen.airtableId,
      createdAt: now,
      updatedAt: now,
    };

    this.screens.set(id, screen);

    // Update screen count for the app
    const app = this.apps.get(screen.appId);
    if (app) {
      app.screenCount = (app.screenCount || 0) + 1;
      this.apps.set(app.id, app);
    }

    return screen;
  }

  // Brand
  private brandLogo: string | null = null;

  async getBrandLogo(): Promise<string | null> {
    return this.brandLogo;
  }
  
  // Fetch categories with their icons from Airtable
  async getCategories(): Promise<any[]> {
    try {
      // Check if API key and base ID are available
      const apiKey = process.env.AIRTABLE_API_KEY;
      const baseId = process.env.AIRTABLE_BASE_ID;
      
      if (!apiKey || !baseId) {
        console.error("Missing Airtable API key or base ID for fetching categories");
        return [];
      }
      
      // Fetch category data from the correct category table name in Airtable
      console.log(`Fetching categories from Airtable base: ${baseId}`);
      
      // Based on the screenshot, the correct table name is "category" and view is likely "Grid view"
      const response = await axios.get(
        `https://api.airtable.com/v0/${baseId}/category`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          params: {
            view: "Grid view",
          },
          timeout: 10000, // 10 second timeout
        }
      );
      
      console.log(`Received category response status: ${response.status}`);
      // Log first record for debugging if any records exist
      if (response.data && response.data.records && response.data.records.length > 0) {
        console.log(`First category record fields: ${JSON.stringify(Object.keys(response.data.records[0].fields))}`);
      }
      
      if (!response.data || !response.data.records) {
        console.error("Invalid response format from Airtable categories API");
        return [];
      }
      
      const records = response.data.records;
      
      // Map the category records to a more usable format with name and icon URL
      const categories = records.map((record: any) => {
        const name = record.fields.Name || "";
        
        // First check for Cloudinary URL in the "importing" field
        let iconUrl = null;
        
        // Prioritize Cloudinary URL if available
        if (record.fields.importing && typeof record.fields.importing === 'string') {
          iconUrl = record.fields.importing;
          console.log(`Using Cloudinary URL for category "${name}": ${iconUrl}`);
        }
        // Fallback to Airtable attachment if no Cloudinary URL
        else if (record.fields.Attachments && 
            Array.isArray(record.fields.Attachments) && 
            record.fields.Attachments.length > 0) {
          iconUrl = record.fields.Attachments[0].url;
          console.log(`Using Airtable attachment URL for category "${name}": ${iconUrl}`);
        }
        
        return {
          id: record.id,
          name,
          iconUrl
        };
      });
      
      console.log(`Fetched ${categories.length} categories with icons from Airtable`);
      return categories;
    } catch (error: any) {
      console.error("Error fetching categories from Airtable:", error.message);
      if (error.response) {
        console.error("API Response Status:", error.response.status);
        console.error("API Response Data:", JSON.stringify(error.response.data));
      }
      return [];
    }
  }

  // Get exact category from Airtable data
  private getCategoryForApp(appName: string): string | null {
    // We'll rely on Airtable API data - categories will be dynamically determined
    return null;
  }

  // Airtable Sync
  async syncFromAirtable(apiKey: string, baseId: string): Promise<void> {
    // We'll move the sync process to a background task so it doesn't block server startup
    // This will allow the server to start up quickly while data syncs in the background
    setTimeout(async () => {
      try {
        console.log("Starting background Airtable data sync...");
        await this.performAirtableSync(apiKey, baseId);
        console.log("Background Airtable sync completed successfully");
      } catch (error: any) {
        console.error("Error in background Airtable sync:", error.message);
        // Try once more after a delay with more detailed error logging
        setTimeout(async () => {
          try {
            console.log("Retrying Airtable sync after initial failure...");
            await this.performAirtableSync(apiKey, baseId);
            console.log("Retry Airtable sync completed successfully");
          } catch (retryError: any) {
            console.error("Error in retry Airtable sync:", retryError.message);
            if (retryError.response) {
              console.error("Response status:", retryError.response.status);
              console.error("Response data:", JSON.stringify(retryError.response.data));
            }
          }
        }, 5000); // Wait 5 seconds before retry
      }
    }, 100);
    
    // Initialize with sample data immediately for faster startup
    this.initializeSampleData();
    
    // Return immediately to allow server to start
    return Promise.resolve();
  }
  
  private async performAirtableSync(apiKey: string, baseId: string): Promise<void> {
    try {
      console.log(`Syncing data from Airtable base ${baseId} in background...`);

      // Define the Airtable field mappings - these must match exactly with your Airtable column names
      const AIRTABLE_TABLE_NAME = "screens"; // Table containing screen images and details
      const APPS_TABLE_NAME = "apps";       // Table containing app metadata and logos
      const BRAND_FILES_TABLE_NAME = "brand"; // Table containing global brand assets

      // Field name constants for more flexibility with Airtable structure - EXACT matches for Airtable columns
      const APP_NAME_FIELD = "appname";    // Field linking screens to apps or containing app name
      const ATTACHMENT_FIELD = "image";    // Field containing screen images - matching column name in screenshots
      const SCREEN_NAME_FIELD = "imagetitle"; // Field containing screen titles/names
      const APP_LOGO_FIELD = "logo (from appname)"; // Field containing app logos in the screens table
      const APP_TYPE_FIELD = "type (from appname)"; // Field containing app type in the screens table
      const APP_CATEGORY_FIELD = "category (from appname)"; // Field containing app category
      const APP_NAME_FIELD_IN_APPS = "name"; // Field containing app names in the apps table

      // Print all field mappings for debugging
      console.log("Airtable Field Mappings:");
      console.log(`APP_NAME_FIELD: "${APP_NAME_FIELD}"`);
      console.log(`ATTACHMENT_FIELD: "${ATTACHMENT_FIELD}"`);
      console.log(`SCREEN_NAME_FIELD: "${SCREEN_NAME_FIELD}"`);
      console.log(`APP_LOGO_FIELD: "${APP_LOGO_FIELD}"`);
      console.log(`APP_TYPE_FIELD: "${APP_TYPE_FIELD}"`);
      console.log(`APP_CATEGORY_FIELD: "${APP_CATEGORY_FIELD}"`);
      console.log(`APP_NAME_FIELD_IN_APPS: "${APP_NAME_FIELD_IN_APPS}"`);


      // 1. Fetch all records from the Airtable screens table with pagination
      // We'll maintain the order from the Airtable screens-list table
      let allScreenRecords: any[] = [];
      let offset: string | undefined = undefined;
      let recordCounter = 0; // Use this to track the original position in the Airtable list

      try {
        do {
          const url = `https://api.airtable.com/v0/${baseId}/${AIRTABLE_TABLE_NAME}`;
          const params: any = { 
            pageSize: 100,
            // Use the specific view to maintain the exact order as seen in Airtable UI
            view: "screens-list" // Using view name instead of hardcoded ID for better portability
          };
          if (offset) {
            params.offset = offset;
          }

          const screensResponse = await axios.get(url, { 
            headers: { 
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            params,
            timeout: 10000 // Add 10 second timeout to avoid hanging
          });

          // Use a simpler approach - add each record with its exact index from Airtable's record list
          for (let i = 0; i < screensResponse.data.records.length; i++) {
            const record = screensResponse.data.records[i];
            // Add the absolute position (recordCounter + i) as the order
            allScreenRecords.push({
              ...record,
              airtableOrder: recordCounter + i
            });
          }
          
          // Move the counter forward by the number of records processed
          recordCounter += screensResponse.data.records.length;
          offset = screensResponse.data.offset;

          console.log(`Fetched batch of ${screensResponse.data.records.length} screen records from Airtable`);
        } while (offset);
      } catch (error: any) {
        console.error("Error fetching screens from Airtable:", error.message);
        if (error.response) {
          console.error("API Response Status:", error.response.status);
          console.error("API Response Headers:", JSON.stringify(error.response.headers));
          console.error("API Response Data:", JSON.stringify(error.response.data));
        } else if (error.request) {
          console.error("No response received from Airtable API");
        }
        // Continue with the sync process with what we have
      }

      console.log(`Fetched a total of ${allScreenRecords.length} screen records from Airtable`);
      
      // Check if we have any records
      if (allScreenRecords.length > 0) {
        // DEBUG: Print first record fields
        console.log("DEBUG: First record fields:", 
          Object.keys(allScreenRecords[0].fields).join(", "));
          
        // Get field that contains position info - debug by printing it for all Meu SUS Digital records
        const meuSusRecords = allScreenRecords.filter(record => {
          const appField = record.fields[APP_NAME_FIELD];
          if (Array.isArray(appField)) {
            return appField.some(id => id.includes('trB2IiTvux50C5')); // Known Meu SUS Digital ID
          }
          return false;
        });
        
        console.log(`DEBUG: Found ${meuSusRecords.length} Meu SUS Digital screen records`);
        
        // For each Meu SUS Digital record, log the name and position field
        meuSusRecords.forEach(record => {
          const name = record.fields[SCREEN_NAME_FIELD] || "Unknown";
          const order = record.fields["airtable_order"] || record.fields["screens-list.order"] || "No order field";
          console.log(`DEBUG: Screen "${name}" position: ${order}`);
        });
      }

      // 2. Fetch all records from the Airtable apps table with pagination
      let allAppRecords: any[] = [];
      let appOffset: string | undefined = undefined;

      try {
        do {
          const url = `https://api.airtable.com/v0/${baseId}/${APPS_TABLE_NAME}`;
          const params: any = { 
            pageSize: 100,
            view: "apps-list" // Using view name instead of default view for better consistency
          };
          if (appOffset) {
            params.offset = appOffset;
          }

          const appsResponse = await axios.get(url, { 
            headers: { 
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            params,
            timeout: 10000 // Add 10 second timeout
          });

          allAppRecords = [...allAppRecords, ...appsResponse.data.records];
          appOffset = appsResponse.data.offset;

          console.log(`Fetched batch of ${appsResponse.data.records.length} app records from Airtable`);
        } while (appOffset);
      } catch (error: any) {
        console.error("Error fetching apps from Airtable:", error.message);
        if (error.response) {
          console.error("API Response Status:", error.response.status);
          console.error("API Response Headers:", JSON.stringify(error.response.headers));
          console.error("API Response Data:", JSON.stringify(error.response.data));
        } else if (error.request) {
          console.error("No response received from Airtable API");
        }
        // Continue with the sync process with what we have
      }

      console.log(`Fetched a total of ${allAppRecords.length} app records from Airtable`);

      // 3. Fetch brand files data
      try {
        const brandFilesUrl = `https://api.airtable.com/v0/${baseId}/${BRAND_FILES_TABLE_NAME}`;
        const brandFilesResponse = await axios.get(brandFilesUrl, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          params: {
            // No specific view needed for brand files - use default view
            // This avoids errors if the view doesn't exist
            maxRecords: 100
          }
        });

        const brandRecords = brandFilesResponse.data.records || [];
        console.log(`Fetched ${brandRecords.length} brand files records from Airtable`);

        // Find the logo-svg file in the brand records
        for (const record of brandRecords) {
          const fields = record.fields;
          if (fields && fields.name === "logo-svg" && fields["brand-file"] && fields["brand-file"].length > 0) {
            const logoAttachment = fields["brand-file"][0];
            this.brandLogo = logoAttachment.url;
            console.log(`Found SVG logo: ${this.brandLogo}`);
            break;
          }
        }
      } catch (error: any) {
        console.error("Error fetching brand files:", error.message);
        if (error.response) {
          console.error("API Response Status:", error.response.status);
          console.error("API Response Headers:", JSON.stringify(error.response.headers));
          console.error("API Response Data:", JSON.stringify(error.response.data));
        } else if (error.request) {
          console.error("No response received from Airtable API for brand files");
        }
        // Continue with the sync process even if we couldn't fetch the brand logo
      }

      // Create a map of app names to their logo URLs
      const appLogosMap = new Map<string, string>();

      // Create maps for app data for more reliable matching
      const appIdToNameMap = new Map<string, string>();
      const appIdToCategoryMap = new Map<string, string>();
      const appIdToTypeMap = new Map<string, string>();

      // First extract all app names, categories, types, and IDs from the apps table
      for (const record of allAppRecords) {
        const fields = record.fields;

        // Get app name
        const appName = fields.name || null;

        if (appName) {
          // Map record ID to app name
          appIdToNameMap.set(record.id, appName);

          // Map record ID to category and type 
          if (fields.category) {
            appIdToCategoryMap.set(record.id, fields.category);
            console.log(`Found category for app ${appName}: ${fields.category}`);
          }

          if (fields.type) {
            appIdToTypeMap.set(record.id, fields.type);
            console.log(`Found type for app ${appName}: ${fields.type}`);
          }

          // Handle logo attachments - check if the record has a logo field
          const logoField = fields.logo || null;
          
          // Also get the Cloudinary URL if available in the "importing" field
          const cloudinaryLogoUrl = fields.importing || null;

          if (logoField && Array.isArray(logoField) && logoField.length > 0) {
            const logoAttachment = logoField[0];
            if (logoAttachment && logoAttachment.url) {
              // Store both the original logo URL and the Cloudinary URL (if available)
              appLogosMap.set(appName, logoAttachment.url);
              appLogosMap.set(record.id, logoAttachment.url);
              
              // If we have a Cloudinary URL, store it in a separate map
              if (cloudinaryLogoUrl) {
                console.log(`Found Cloudinary logo URL for app: ${appName}: ${cloudinaryLogoUrl}`);
                // Store Cloudinary URL with a special prefix to distinguish it
                appLogosMap.set(`cloudinary:${appName}`, cloudinaryLogoUrl);
                appLogosMap.set(`cloudinary:${record.id}`, cloudinaryLogoUrl);
              } else {
                console.log(`No Cloudinary logo URL found for app: ${appName}`);
              }
              
              console.log(`Found logo for app: ${appName}`);
            }
          }
        }
      }

      // Log all found app logos for debugging
      console.log(`Found ${appLogosMap.size} app logos in total.`);

      // We'll skip manual logo mappings and rely only on Airtable data

      // First, log all Airtable app records to debug what names are actually in Airtable
      // Full app record debugging
      console.log("DEBUG: First app record structure:");
      if (allAppRecords.length > 0) {
        console.log(JSON.stringify(allAppRecords[0], null, 2));
        console.log("DEBUG: Available fields in first app record:", 
          Object.keys(allAppRecords[0].fields).join(", "));
      }

      console.log("DEBUG: All Airtable app records:");
      allAppRecords.forEach(record => {
        // Use APP_NAME_FIELD_IN_APPS constant or check multiple possible field names
        const appName = record.fields[APP_NAME_FIELD_IN_APPS] || 
                        record.fields.name || 
                        record.fields.title || 
                        record.fields.appname ||
                        'null';
        console.log(`  - ID: ${record.id}, Name: ${appName}`);
      });

      // Add manual mappings for apps that might not be properly named - exact names from Airtable
      // These should be updated to reflect exactly what's in Airtable
      // Initialize empty mapping - we'll populate this directly from Airtable data
      const appNameMappings: Record<string, string> = {};

      // No manual mappings needed

      // We'll skip direct mappings and let Airtable data determine app names and details
      const directAppMappings: Record<string, string> = {};

      // Now populate any other app names from the Airtable data
      allAppRecords.forEach(record => {
        // Use APP_NAME_FIELD_IN_APPS constant or check multiple possible field names
        const appName = record.fields[APP_NAME_FIELD_IN_APPS] || 
                       record.fields.name || 
                       record.fields.title || 
                       record.fields.appname;

        if (record.id && appName) {
          // Add mapping from Airtable data
          appNameMappings[record.id] = appName;
          console.log(`DEBUG: Added mapping from Airtable data: ${record.id} => ${appName}`);
        }
      });

      // Log all app ID to name mappings for verification
      console.log("DEBUG: App ID to Name mappings:");
      Object.entries(appNameMappings).forEach(([id, name]) => {
        console.log(`  - ID: ${id}, Name: ${name}`);
      });

      // Add these mappings to the appIdToNameMap
      Object.entries(appNameMappings).forEach(([id, name]) => {
        appIdToNameMap.set(id, name);
      });

      // Group screen records by app name to create distinct apps
      const appGroups = new Map<string, any[]>();

      // Process and group screen records
      // Log a sample record to debug field names
      if (allScreenRecords.length > 0) {
        console.log('Sample record field names:', Object.keys(allScreenRecords[0].fields).join(', '));
        // Log a specific record for PIX to debug
        const pixRecords = allScreenRecords.filter(record => {
          const appname = record.fields.appname;
          if (Array.isArray(appname) && appname.length > 0 && appname[0].id === 'rectunLB0N9QwObTS') {
            return true;
          }
          return false;
        });
        if (pixRecords.length > 0) {
          console.log('PIX record field names:', Object.keys(pixRecords[0].fields).join(', '));
          console.log('PIX app name from record:', 
            Array.isArray(pixRecords[0].fields.appname) && pixRecords[0].fields.appname.length > 0 ? 
            pixRecords[0].fields.appname[0].id : 'Not found');
        }
      }

      for (const record of allScreenRecords) {
        const fields = record.fields;

        // Skip records without required fields
        if (!fields[APP_NAME_FIELD] && !fields['app-name'] && !fields['appname'] && !fields['app']) {
          console.log('Skipping record without app name:', record.id);
          continue;
        }

        if (!fields[ATTACHMENT_FIELD] && !fields['image'] && !fields['attachment'] && !fields['images']) {
          console.log('Skipping record without image:', record.id);
          continue;
        }

        // Debug for the specific field we need
        if (record.id === 'recFeNuRH3cMZiM2j') {
          console.log('DEBUG record fields:', Object.keys(fields));
          console.log('DEBUG appname field:', JSON.stringify(fields[APP_NAME_FIELD]));
          console.log('DEBUG image field:', fields[ATTACHMENT_FIELD] ? 'exists' : 'missing');
        }

        // Based on the Airtable screenshot, we should be looking for the "appname" field which links to the apps table
        let appNameField = fields[APP_NAME_FIELD]; // This should be "appname" from our constants

        // If the app name field is an object or array with an ID, try to find its name
        let appRecordId: string | null = null;
        let appName: string = "Unknown App";

        // Add more debug logging for app name field
        console.log(`DEBUG: Screen '${fields[SCREEN_NAME_FIELD] || "Unknown"}' app name field:`, 
          JSON.stringify(appNameField));

        // Extract the app ID or name from the appNameField
        if (Array.isArray(appNameField)) {
          // For linked records that return arrays (most likely scenario with Airtable)
          if (appNameField.length > 0) {
            if (typeof appNameField[0] === 'object' && appNameField[0].id) {
              // This is an object with linked record data
              appRecordId = appNameField[0].id;
              console.log(`DEBUG: Found linked app record ID: ${appRecordId}`);

              // Directly use the ID to look up the name from our mapping
              if (appRecordId && appNameMappings[appRecordId]) {
                appName = appNameMappings[appRecordId];
                console.log(`DEBUG: Mapped app name from ID mapping: ${appName}`);
              }
            } else {
              // This is just an array of IDs or strings
              appRecordId = typeof appNameField[0] === 'string' ? appNameField[0] : null;
              console.log(`DEBUG: Found app ID as string in array: ${appRecordId}`);

              // Directly use the ID to look up the name from our mapping
              if (appRecordId && appNameMappings[appRecordId]) {
                appName = appNameMappings[appRecordId];
                console.log(`DEBUG: Mapped app name from ID string in array: ${appName}`);
              }
            }
          }
        } else if (typeof appNameField === 'object' && appNameField !== null) {
          // For linked records that return a single object
          appRecordId = appNameField.id || null;
          console.log(`DEBUG: Found app object with ID: ${appRecordId}`);

          // Directly use the ID to look up the name from our mapping
          if (appRecordId && appNameMappings[appRecordId]) {
            appName = appNameMappings[appRecordId];
            console.log(`DEBUG: Mapped app name from object ID: ${appName}`);
          }
        } else if (typeof appNameField === 'string') {
          // Regular string field
          appRecordId = appNameField;
          console.log(`DEBUG: Found app ID as string: ${appRecordId}`);

          // Directly use the ID to look up the name from our mapping
          if (appNameMappings[appRecordId]) {
            appName = appNameMappings[appRecordId];
            console.log(`DEBUG: Mapped app name from string ID: ${appName}`);
          }
        }

        // Log the final app record ID and name after all mappings
        if (appRecordId) {
          console.log(`DEBUG: Final mapping - App Record ID: ${appRecordId}, App Name: ${appName}`);
        }

        // Check the current screen for app name clues in title or description
        const screenTitle = fields[SCREEN_NAME_FIELD] || fields.name || fields.title || '';
        const screenDescription = fields.description || '';

        // Use content to help determine the app identity more accurately
        if (screenTitle || screenDescription) {
          // Convert to lowercase for case-insensitive matching
          const titleLower = screenTitle.toString().toLowerCase();
          const descLower = screenDescription.toString().toLowerCase();

          // Debug the appRecordId and related screen details
          if (appRecordId) {
            console.log(`DEBUG: Screen "${screenTitle}" has app record ID: ${appRecordId}`);
          }

          // Use the appRecordId to look up the name directly from Airtable data
          if (appRecordId && appNameMappings[appRecordId]) {
            appName = appNameMappings[appRecordId];
            console.log(`DEBUG: Assigned app name from record ID ${appRecordId}: ${appName}`);
          }
        }

        // Get all screens that have already been processed with this app name
        const currentAppRecords = appGroups.get(appName) || [];

        // Check if any screen has e-Título related text
        const hasEtituloScreens = currentAppRecords.some((r: any) => {
          const screenName = (r.fields?.name || r.fields?.title || '').toString().toLowerCase();
          return screenName.includes('e-título') || 
                 screenName.includes('etitulo') || 
                 screenName.includes('título eleitoral');
        });

        // Check if any screen has CDT related text
        const hasCDTScreens = currentAppRecords.some((r: any) => {
          const screenName = (r.fields?.name || r.fields?.title || '').toString().toLowerCase();
          return screenName.includes('carteira digital de trânsito') || 
                 screenName.includes('cdt') || 
                 screenName.includes('trânsito');
        });

        // We rely on Airtable data and record IDs for proper mapping now

        if (!appGroups.has(appName)) {
          appGroups.set(appName, []);
        }

        appGroups.get(appName)?.push(record);
      }

      console.log(`Identified ${appGroups.size} unique apps`);

      // Clear existing data before importing new data
      this.apps.clear();
      this.screens.clear();
      this.appIdCounter = 1;
      this.screenIdCounter = 1;

      // 3. Process each app group
      // Convert Map entries to Array to fix TypeScript error
      const appGroupsArray = Array.from(appGroups).map(([appName, records]) => ({ appName, records }));
      for (const { appName, records } of appGroupsArray) {
        // Use first record to get app metadata
        const firstRecord = records[0];
        const fields = firstRecord.fields;

        // Try different possible field names for images/attachments
        const attachments = 
          (fields[ATTACHMENT_FIELD] && fields[ATTACHMENT_FIELD].length > 0 ? fields[ATTACHMENT_FIELD] :
          (fields['image'] && fields['image'].length > 0 ? fields['image'] :
          (fields['attachment'] && fields['attachment'].length > 0 ? fields['attachment'] : null)));

        const thumbnailAttachment = attachments && attachments[0];
        const thumbnailUrl = thumbnailAttachment ? thumbnailAttachment.url : "https://via.placeholder.com/500x300";

        // Get logo from the linked app's info in the "logo (from appname)" field
        let logoUrl = null;

        // First check if the record has the "logo (from appname)" field which comes from linked field
        if (fields[APP_LOGO_FIELD]) {
          // This field might contain the logo URL directly
          const logoField = fields[APP_LOGO_FIELD];

          if (Array.isArray(logoField) && logoField.length > 0 && logoField[0].url) {
            // This is an array of attachments
            logoUrl = logoField[0].url;
          } else if (typeof logoField === 'string') {
            // This is a URL string
            logoUrl = logoField;
          }
        }

        // Fallback to our app logos map if the logo wasn't found in the record
        if (!logoUrl) {
          logoUrl = appLogosMap.get(appName);
        }

        // Get app record ID from the first linked screen
        let appRecordId = null;

        // Extract app record ID from the first screen's appname field
        if (records[0] && records[0].fields && records[0].fields[APP_NAME_FIELD]) {
          const appNameField = records[0].fields[APP_NAME_FIELD];

          if (Array.isArray(appNameField) && appNameField.length > 0) {
            if (typeof appNameField[0] === 'object' && appNameField[0].id) {
              appRecordId = appNameField[0].id;
            } else if (typeof appNameField[0] === 'string') {
              appRecordId = appNameField[0];
            }
          } else if (typeof appNameField === 'object' && appNameField !== null) {
            appRecordId = appNameField.id || null;
          } else if (typeof appNameField === 'string') {
            appRecordId = appNameField;
          }
        }

        console.log(`DEBUG: App ${appName} has record ID: ${appRecordId}`);

        // Look up category and type from our maps
        let appCategory = null;
        let appType = fields[APP_TYPE_FIELD]; // Try to get from screens record first

        // Use Airtable data for categories
        if (appRecordId) {
          // Get category from our map
          if (appIdToCategoryMap.has(appRecordId)) {
            appCategory = appIdToCategoryMap.get(appRecordId);
            console.log(`DEBUG: Retrieved category ${appCategory} for app ${appName} from ID ${appRecordId}`);
          }

          // Get type from our map if not already set
          if (!appType && appIdToTypeMap.has(appRecordId)) {
            appType = appIdToTypeMap.get(appRecordId);
            console.log(`DEBUG: Retrieved type ${appType} for app ${appName} from ID ${appRecordId}`);
          }
        }

        // Default to 'Federal' if no type is found
        if (!appType) {
          appType = "Federal";
        }

        // Check if we have a Cloudinary logo URL for this app
        let cloudinaryLogoUrl = null;
        if (appRecordId) {
          cloudinaryLogoUrl = appLogosMap.get(`cloudinary:${appRecordId}`);
        }
        if (!cloudinaryLogoUrl && appName) {
          cloudinaryLogoUrl = appLogosMap.get(`cloudinary:${appName}`);
        }
        
        // Log if we found a Cloudinary logo URL
        if (cloudinaryLogoUrl) {
          console.log(`DEBUG: Using Cloudinary logo URL for ${appName}: ${cloudinaryLogoUrl}`);
        }
        
        // Get country from the apps table record if available
        let country = null;
        let status = "Visible"; // Default status is "Visible"
        if (appRecordId && allAppRecords) {
          const appRecord = allAppRecords.find(record => record.id === appRecordId);
          if (appRecord && appRecord.fields) {
            if (appRecord.fields.country) {
              country = appRecord.fields.country;
              console.log(`DEBUG: Found country for app ${appName}: ${country}`);
            }
            if (appRecord.fields.status) {
              status = appRecord.fields.status;
              console.log(`DEBUG: Found status for app ${appName}: ${status}`);
            }
          }
        }
        
        const appData: InsertApp = {
          name: appName,
          description: fields.description || `Collection of design screens from ${appName}`,
          thumbnailUrl: thumbnailUrl,
          logo: logoUrl || null, // Use logo from apps table if available
          cloudinaryLogo: cloudinaryLogoUrl, // Include Cloudinary logo URL if available
          type: appType,
          category: appCategory || fields[APP_CATEGORY_FIELD] || "Government", // Use mapped category
          platform: fields.platform || "iOS", // Default platform
          language: fields.language || null, // Default language can be null
          country: country, // Country from Airtable record
          screenCount: records.length,
          url: fields.url || null, // No external URL by default
          status: status, // Status from Airtable record (Visible, Hide, Planejado)
          airtableId: firstRecord.id,
        };

        // Debug Unknown App
        if (appName === "Unknown App") {
          console.log("DEBUG: Unknown App details:");
          console.log("  - First record ID:", firstRecord.id);
          console.log("  - App name field:", JSON.stringify(fields[APP_NAME_FIELD]));
          console.log("  - Field keys:", Object.keys(fields).join(", "));
          if (fields[APP_NAME_FIELD] && Array.isArray(fields[APP_NAME_FIELD]) && fields[APP_NAME_FIELD].length > 0) {
            console.log("  - App ID:", fields[APP_NAME_FIELD][0].id);
          }

          // Try to find sample screen title to help identify the app
          const sampleTitle = fields[SCREEN_NAME_FIELD] || "";
          console.log("  - Sample screen title:", sampleTitle);
        }

        // Create the app
        const app = await this.createApp(appData);
        console.log(`Created app: ${app.name} with ${records.length} screens${logoUrl ? ' and logo' : ''}`);

        // 4. Process screens for this app
        for (let i = 0; i < records.length; i++) {
          const record = records[i];
          const fields = record.fields;

          // Try different possible field names for attachments
          const attachmentField = 
            (fields[ATTACHMENT_FIELD] && fields[ATTACHMENT_FIELD].length > 0 ? fields[ATTACHMENT_FIELD] :
            (fields['image'] && fields['image'].length > 0 ? fields['image'] :
            (fields['attachment'] && fields['attachment'].length > 0 ? fields['attachment'] :
            (fields['images'] && fields['images'].length > 0 ? fields['images'] : null))));

          // Skip records without attachments
          if (!attachmentField || !attachmentField.length) {
            console.log(`Skipping screen record for ${appName} without attachment: ${record.id}`);
            continue;
          }

          const attachment = attachmentField[0];

          // Try different possible field names for screen name
          const screenName = fields[SCREEN_NAME_FIELD] || 
                           fields['name'] || 
                           fields['title'] || 
                           fields['screen-name'] || 
                           fields['screen_name'] || 
                           `Screen ${i + 1}`;

          // Determine screen type - set splash/login screens to lower order values
          const lowerCaseName = screenName.toLowerCase();
          const isIntroScreen = 
            lowerCaseName.includes('splash') || 
            lowerCaseName.includes('início') || 
            lowerCaseName.includes('login') || 
            lowerCaseName.includes('welcome') || 
            lowerCaseName.includes('intro') ||
            lowerCaseName.includes('start') ||
            lowerCaseName.includes('abertura');

          // Use the Airtable order we stored in each record
          // This ensures screens appear in the same order as they do in the Airtable screens-list table
          let screenOrder;
          
          // Access the airtableOrder property we added earlier
          if (record.airtableOrder !== undefined) {
            screenOrder = record.airtableOrder;
            console.log(`Using Airtable table order ${screenOrder} for screen "${screenName}" in app "${appName}"`);
          } else {
            // Fallback if for some reason the record doesn't have an airtableOrder
            screenOrder = 1000 + i;
            console.log(`No Airtable order found for "${screenName}" in app "${appName}", using default order ${screenOrder}`);
          }
          
          // Special case: prioritize intro screens
          if (isIntroScreen) {
            screenOrder = -1; // Always put intro screens first
          }

          // Extract tags from Airtable fields
          let tags: string[] | null = null;
          if (fields.tags && Array.isArray(fields.tags)) {
            tags = fields.tags;
          }

          // Extract category from Airtable fields or from the parent app
          let category: string | null = null;
          if (fields.category) {
            category = fields.category;
          } else if (app.category) {
            category = app.category;
          }

          // Extract alt text for accessibility
          let altText = fields.alttext || null;
          
          // If no alttext is provided, create a descriptive one based on screen name and app
          if (!altText) {
            altText = `${screenName} screen from ${appName} application`;
          }
          
          const screenData: InsertScreen = {
            appId: app.id,
            name: screenName,
            description: fields.description || null,
            imageUrl: attachment.url,
            // Include the Cloudinary URL if present in the "importing" field
            cloudinaryUrl: fields.importing || null,
            altText: altText,
            flow: fields.flow || null,
            order: screenOrder,
            tags: tags,
            category: category,
            airtableId: record.id,
          };

          // Create the screen
          await this.createScreen(screenData);
        }
      }

      console.log("Airtable sync completed successfully");

    } catch (error) {
      console.error("Error syncing from Airtable:", error);
      throw new Error("Failed to sync from Airtable");
    }
  }

  // Initialize with sample data for development
  private initializeSampleData() {
    // Sample apps
    const sampleApps: InsertApp[] = [
      {
        name: "Meu SUS Digital",
        description: "Brazil's official healthcare app that provides access to digital health cards, vaccination records, appointment scheduling, and other public health services.",
        thumbnailUrl: "https://random.imagecdn.app/500/300?image=1",
        logo: "https://random.imagecdn.app/100/100?image=11",
        type: "Federal",
        category: "Healthcare",
        platform: "iOS",
        language: "Portuguese",
        screenCount: 15,
        url: "https://example.com/meusus",
        airtableId: "rec1",
      },
      {
        name: "Carteira de Trabalho Digital",
        description: "Digital employment record management for Brazilian workers, allowing them to access work history, contracts, and employment benefits.",
        thumbnailUrl: "https://random.imagecdn.app/500/300?image=2",
        logo: "https://random.imagecdn.app/100/100?image=12",
        type: "Federal",
        category: "Employment",
        platform: "iOS",
        language: "Portuguese",
        screenCount: 12,
        url: "https://example.com/ctps",
        airtableId: "rec2",
      },
      {
        name: "Conecta Recife",
        description: "Municipal services platform for Recife citizens, providing access to local government services, news, and civic engagement opportunities.",
        thumbnailUrl: "https://random.imagecdn.app/500/300?image=3",
        logo: "https://random.imagecdn.app/100/100?image=13",
        type: "Municipal",
        category: "City Services",
        platform: "Android",
        language: "Portuguese",
        screenCount: 8,
        url: "https://example.com/conectarecife",
        airtableId: "rec3",
      },
      {
        name: "Vacinas Brasil",
        description: "National vaccination management and tracking platform, allowing citizens to monitor immunization records and vaccination campaigns.",
        thumbnailUrl: "https://random.imagecdn.app/500/300?image=4",
        logo: "https://random.imagecdn.app/100/100?image=14",
        type: "Federal",
        category: "Healthcare",
        platform: "iOS",
        language: "Portuguese",
        screenCount: 10,
        url: "https://example.com/vacinas",
        airtableId: "rec4",
      },
      {
        name: "Gov.br",
        description: "Central platform for Brazilian government services and documents, integrating various federal services in a unified digital interface.",
        thumbnailUrl: "https://random.imagecdn.app/500/300?image=5",
        logo: "https://random.imagecdn.app/100/100?image=15",
        type: "Federal",
        category: "Government",
        platform: "Cross-platform",
        language: "Portuguese",
        screenCount: 18,
        url: "https://example.com/govbr",
        airtableId: "rec5",
      },
      {
        name: "Exames SUS",
        description: "Medical examination scheduling and results tracking for the public health system, enabling citizens to manage health exams digitally.",
        thumbnailUrl: "https://random.imagecdn.app/500/300?image=6",
        logo: "https://random.imagecdn.app/100/100?image=16",
        type: "Federal",
        category: "Healthcare",
        platform: "iOS",
        language: "Portuguese",
        screenCount: 7,
        url: "https://example.com/exames",
        airtableId: "rec6",
      }
    ];

    // Create sample apps
    sampleApps.forEach(app => {
      const id = this.appIdCounter++;
      const now = new Date();
      const slug = this.createSlugFromName(app.name);

      this.apps.set(id, {
        id,
        name: app.name,
        description: app.description,
        thumbnailUrl: app.thumbnailUrl,
        logo: app.logo ?? null,
        cloudinaryLogo: null, // No Cloudinary logos for sample data
        type: app.type,
        category: app.category,
        platform: app.platform,
        language: app.language ?? null,
        screenCount: app.screenCount ?? 0,
        url: app.url ?? null,
        slug: slug,
        airtableId: app.airtableId,
        createdAt: now,
        updatedAt: now,
      });
    });

    // Create sample screens for the first app (Meu SUS Digital)
    const screenTypes = [
      { name: "Login", description: "Initial app login screen", category: "Autenticação" },
      { name: "Home", description: "Main dashboard", category: "Home" },
      { name: "Profile", description: "User profile view", category: "Perfil" },
      { name: "Notifications", description: "Notification center", category: "Notificações" },
      { name: "Vaccination", description: "Vaccination records", category: "Saúde" },
      { name: "Health Card", description: "Digital health card", category: "Documentos" },
      { name: "Appointments", description: "Schedule medical appointments", category: "Agendamento" },
      { name: "Medications", description: "Prescribed medications", category: "Saúde" },
      { name: "Hospitals", description: "Nearby hospitals and clinics", category: "Localização" },
      { name: "Lab Results", description: "Laboratory test results", category: "Resultados" },
    ];

    screenTypes.forEach((screenType, index) => {
      const id = this.screenIdCounter++;
      const now = new Date();

      this.screens.set(id, {
        id,
        appId: 1, // First app (Meu SUS Digital)
        name: screenType.name,
        description: screenType.description,
        imageUrl: `https://random.imagecdn.app/400/800?image=${20 + index}`,
        cloudinaryUrl: null, // Adding cloudinaryUrl field to sample data
        altText: `${screenType.name} screen from Meu SUS Digital application`,
        flow: "Main",
        order: index,
        tags: ["healthcare", "digital"],
        category: screenType.category || "Saúde",
        airtableId: `screen${index + 1}`,
        createdAt: now,
        updatedAt: now,
      });
    });

    // Create sample screens for the second app (Carteira de Trabalho Digital)
    const ctpsScreenTypes = [
      { name: "Welcome", description: "App introduction screen", category: "Onboarding" },
      { name: "Registration", description: "User registration", category: "Cadastro" },
      { name: "Work History", description: "Employment history view", category: "Histórico" },
      { name: "Current Job", description: "Current employment details", category: "Trabalho" },
      { name: "Benefits", description: "Employment benefits", category: "Benefícios" },
      { name: "Documents", description: "Digital work documents", category: "Documentos" },
      { name: "Notifications", description: "System notifications", category: "Notificações" },
    ];

    ctpsScreenTypes.forEach((screenType, index) => {
      const id = this.screenIdCounter++;
      const now = new Date();

      this.screens.set(id, {
        id,
        appId: 2, // Second app (Carteira de Trabalho Digital)
        name: screenType.name,
        description: screenType.description,
        imageUrl: `https://random.imagecdn.app/400/800?image=${30 + index}`,
        cloudinaryUrl: null, // Add missing cloudinaryUrl field
        altText: `${screenType.name} screen from Carteira de Trabalho Digital application`,
        flow: "Main",
        order: index,
        tags: ["employment", "documents"],
        category: screenType.category || "Trabalho",
        airtableId: `ctps${index + 1}`,
        createdAt: now,
        updatedAt: now,
      });
    });
  }
}

// Create and export the storage instance
export const storage = new MemStorage();