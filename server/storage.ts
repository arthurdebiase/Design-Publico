import { 
  App, InsertApp, 
  Screen, InsertScreen,
  apps as appsTable,
  screens as screensTable
} from "@shared/schema";
import axios from "axios";

// Interface for storage operations
export interface IStorage {
  // Apps
  getApps(filters?: { type?: string; platform?: string; search?: string }): Promise<App[]>;
  getAppById(id: number): Promise<App | undefined>;
  createApp(app: InsertApp): Promise<App>;
  
  // Screens
  getScreensByAppId(appId: number): Promise<Screen[]>;
  createScreen(screen: InsertScreen): Promise<Screen>;
  
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
    
    return result;
  }

  async getAppById(id: number): Promise<App | undefined> {
    return this.apps.get(id);
  }

  async createApp(insertApp: InsertApp): Promise<App> {
    const id = this.appIdCounter++;
    const now = new Date();
    
    // Ensure all required fields have appropriate values
    const app: App = {
      id,
      name: insertApp.name,
      description: insertApp.description,
      thumbnailUrl: insertApp.thumbnailUrl,
      logo: insertApp.logo ?? null,
      type: insertApp.type,
      category: insertApp.category,
      platform: insertApp.platform,
      language: insertApp.language ?? null,
      screenCount: insertApp.screenCount ?? 0,
      url: insertApp.url ?? null,
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
      .sort((a, b) => a.order - b.order);
    
    return result;
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
      flow: insertScreen.flow ?? null,
      order: insertScreen.order ?? 0,
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

  // Airtable Sync
  async syncFromAirtable(apiKey: string, baseId: string): Promise<void> {
    try {
      console.log(`Syncing data from Airtable base ${baseId}...`);
      
      // Define the Airtable field mappings - these must match exactly with your Airtable column names
      const AIRTABLE_TABLE_NAME = "screens"; // Table containing screen images and details
      const APPS_TABLE_NAME = "apps";       // Table containing app metadata and logos
      const BRAND_FILES_TABLE_NAME = "brand"; // Table containing global brand assets
      
      // Field name constants for more flexibility with Airtable structure
      const APP_NAME_FIELD = "app";        // Field linking screens to apps or containing app name
      const ATTACHMENT_FIELD = "images";   // Field containing screen images
      const SCREEN_NAME_FIELD = "title";   // Field containing screen titles/names
      const APP_LOGO_FIELD = "logo";       // Field containing app logos
      const APP_NAME_FIELD_IN_APPS = "name"; // Field containing app names in the apps table
      
      // 1. Fetch all records from the Airtable screens table with pagination
      let allScreenRecords: any[] = [];
      let offset: string | undefined = undefined;
      
      do {
        const url = `https://api.airtable.com/v0/${baseId}/${AIRTABLE_TABLE_NAME}`;
        const params: any = { pageSize: 100 };
        if (offset) {
          params.offset = offset;
        }
        
        const screensResponse = await axios.get(url, { 
          headers: { 
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          params
        });
        
        allScreenRecords = [...allScreenRecords, ...screensResponse.data.records];
        offset = screensResponse.data.offset;
        
        console.log(`Fetched batch of ${screensResponse.data.records.length} screen records from Airtable`);
      } while (offset);
      
      console.log(`Fetched a total of ${allScreenRecords.length} screen records from Airtable`);
      
      // 2. Fetch all records from the Airtable apps table with pagination
      let allAppRecords: any[] = [];
      let appOffset: string | undefined = undefined;
      
      do {
        const url = `https://api.airtable.com/v0/${baseId}/${APPS_TABLE_NAME}`;
        const params: any = { pageSize: 100 };
        if (appOffset) {
          params.offset = appOffset;
        }
        
        const appsResponse = await axios.get(url, { 
          headers: { 
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          params
        });
        
        allAppRecords = [...allAppRecords, ...appsResponse.data.records];
        appOffset = appsResponse.data.offset;
        
        console.log(`Fetched batch of ${appsResponse.data.records.length} app records from Airtable`);
      } while (appOffset);
      
      console.log(`Fetched a total of ${allAppRecords.length} app records from Airtable`);
      
      // 3. Fetch brand files data
      try {
        const brandFilesUrl = `https://api.airtable.com/v0/${baseId}/${BRAND_FILES_TABLE_NAME}`;
        const brandFilesResponse = await axios.get(brandFilesUrl, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
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
      } catch (error) {
        console.error("Error fetching brand files:", error);
        // Continue with the sync process even if we couldn't fetch the brand logo
      }
      
      // Create a map of app names to their logo URLs
      const appLogosMap = new Map<string, string>();
      
      // Create a map of app IDs to app names for more reliable matching
      const appIdToNameMap = new Map<string, string>();
      
      // First extract all app names and IDs from the apps table
      for (const record of allAppRecords) {
        const fields = record.fields;
        if (fields && fields[APP_NAME_FIELD_IN_APPS]) {
          const appName = fields[APP_NAME_FIELD_IN_APPS];
          appIdToNameMap.set(record.id, appName);
          
          // Store logos mapped to both ID and name for maximum compatibility
          if (fields[APP_LOGO_FIELD] && fields[APP_LOGO_FIELD].length > 0) {
            const logoAttachment = fields[APP_LOGO_FIELD][0];
            appLogosMap.set(appName, logoAttachment.url);
            appLogosMap.set(record.id, logoAttachment.url);
            console.log(`Found logo for app: ${appName}`);
          }
        }
      }
      
      // Add manual mappings for apps that might not be properly named
      const appNameMappings: Record<string, string> = {
        "recqLTQuYEOSBqzE4": "Gov.br",
        "recUmYPNDhj1qx9en": "Conecta Recife",
        "rectrB2IiTvux50C5": "Meu SUS Digital",
        "rectunLB0N9QwObTS": "Pix",
        "recb065qS5JzHh9Xt": "Carteira de Trabalho Digital",
        "recFWaslN9KIZVTap": "Meu INSS",
        "rec4ixvEzLW5JHqnm": "Carteira Digital de Trânsito",
        "recO0Fz9BhXYpqTgJ": "e-Título",
        "recGwK0XXHDMrfzL8": "Celular Seguro BR",
        "recb4PdJEShoxI0x5": "Correios",
        "recEL1ZOe6nGpEP73": "CAIXA Tem",
        "recJBNHjc8G2QvEb4": "MEI",
        "recMNEJDQCCupjYZJ": "Cadastro Único",
        "recXnV9THYptJQ1UL": "Receita Federal",
        "recqJwRQQxGxYLnp4": "CAIXA",
        "recKe1q9hB1oEEfn5": "Resultados",
        "reczpknduWvlL2cey": "Zona Azul Digital Recife"
      };
      
      // Add these mappings to the appIdToNameMap
      Object.entries(appNameMappings).forEach(([id, name]) => {
        appIdToNameMap.set(id, name);
      });
      
      // Group screen records by app name to create distinct apps
      const appGroups = new Map<string, any[]>();
      
      // Process and group screen records
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
        
        // Try different possible field names for app name
        let appNameField = fields[APP_NAME_FIELD] || fields['app-name'] || fields['appname'] || fields['app'];
        
        // If the app name field is an object or array with an ID, try to find its name
        let appRecordId: string | null = null;
        let appName: string = "Unknown App";
        
        // Extract the app ID or name from the appNameField
        if (Array.isArray(appNameField)) {
          // For linked records that return arrays
          if (typeof appNameField[0] === 'object' && appNameField[0].id) {
            appRecordId = appNameField[0].id;
            if (appNameField[0].name) {
              appName = appNameField[0].name;
            }
          } else {
            appRecordId = typeof appNameField[0] === 'string' ? appNameField[0] : null;
            appName = appRecordId || "Unknown App";
          }
        } else if (typeof appNameField === 'object' && appNameField !== null) {
          // For linked records that return objects
          appRecordId = appNameField.id || null;
          if (appNameField.name) {
            appName = appNameField.name;
          } else {
            // Default to the ID if no name is found
            appName = appNameField.id || "Unknown App";
          }
        } else {
          // Regular string field (might be an ID or name)
          appRecordId = appNameField;
          appName = appNameField;
        }
        
        // First try to get a name from our ID-to-name mapping
        if (appRecordId && appIdToNameMap.has(appRecordId)) {
          appName = appIdToNameMap.get(appRecordId) || appName;
        }
        
        // Check the current screen for app name clues in title or description
        const screenTitle = fields[SCREEN_NAME_FIELD] || fields.name || fields.title || '';
        const screenDescription = fields.description || '';
        
        // Use content to help determine the app identity more accurately
        if (screenTitle || screenDescription) {
          // Convert to lowercase for case-insensitive matching
          const titleLower = screenTitle.toString().toLowerCase();
          const descLower = screenDescription.toString().toLowerCase();
          
          // Special case patterns
          if (titleLower.includes('e-título') || descLower.includes('e-título') || 
              titleLower.includes('etitulo') || titleLower.includes('título eleitoral')) {
            appName = "e-Título";
          } else if (titleLower.includes('carteira digital de trânsito') || 
                     titleLower.includes('cdt') || descLower.includes('cdt') || 
                     (titleLower.includes('trânsito') && titleLower.includes('carteira'))) {
            appName = "Carteira Digital de Trânsito";
          } else if (appRecordId === "recqLTQuYEOSBqzE4" || titleLower.includes('gov.br')) {
            appName = "Gov.br";
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
        
        // Update app name based on screen content
        if (hasEtituloScreens) {
          appName = "e-Título";
        } else if (hasCDTScreens) {
          appName = "Carteira Digital de Trânsito";
        }
        
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
        
        // Check if we have a logo for this app from the apps table
        const logoUrl = appLogosMap.get(appName);
        
        // Create app with default values and override with actual data if available
        // Set correct app type based on the app name
        let appType = fields.type;
        if (!appType) {
          // Specific app-based overrides for missing type values
          if (appName === "Conecta Recife" || appName === "Zona Azul Digital Recife") {
            appType = "Municipal";
          } else if (appName === "Carteira de Trabalho Digital" || 
                    appName === "Meu SUS Digital" ||
                    appName === "Gov.br" ||
                    appName === "e-Título" ||
                    appName === "Carteira Digital de Trânsito" ||
                    appName === "Meu INSS" ||
                    appName === "Pix" ||
                    appName === "CAIXA" ||
                    appName === "CAIXA Tem" ||
                    appName === "Receita Federal" ||
                    appName === "MEI" ||
                    appName === "Cadastro Único" ||
                    appName === "Correios" ||
                    appName === "Celular Seguro BR") {
            appType = "Federal";
          } else {
            appType = "Federal"; // Default fallback
          }
        }
        
        const appData: InsertApp = {
          name: appName,
          description: fields.description || `Collection of design screens from ${appName}`,
          thumbnailUrl: thumbnailUrl,
          logo: logoUrl || null, // Use logo from apps table if available
          type: appType,
          category: fields.category || "Government", // Default category
          platform: fields.platform || "iOS", // Default platform
          language: fields.language || null, // Default language can be null
          screenCount: records.length,
          url: fields.url || null, // No external URL by default
          airtableId: firstRecord.id,
        };
        
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
          
          // Make sure splash screens appear first in the order
          let screenOrder = i;
          if (i < 3 && isIntroScreen) {
            // Force intro screens to the beginning by setting order to -1, 0, or very low numbers
            screenOrder = -1000 + i;
          }
          
          const screenData: InsertScreen = {
            appId: app.id,
            name: screenName,
            description: fields.description || null,
            imageUrl: attachment.url,
            flow: fields.flow || null,
            order: screenOrder,
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
      
      this.apps.set(id, {
        id,
        name: app.name,
        description: app.description,
        thumbnailUrl: app.thumbnailUrl,
        logo: app.logo ?? null,
        type: app.type,
        category: app.category,
        platform: app.platform,
        language: app.language ?? null,
        screenCount: app.screenCount ?? 0,
        url: app.url ?? null,
        airtableId: app.airtableId,
        createdAt: now,
        updatedAt: now,
      });
    });
    
    // Create sample screens for the first app (Meu SUS Digital)
    const screenTypes = [
      { name: "Login", description: "Initial app login screen" },
      { name: "Home", description: "Main dashboard" },
      { name: "Profile", description: "User profile view" },
      { name: "Notifications", description: "Notification center" },
      { name: "Vaccination", description: "Vaccination records" },
      { name: "Health Card", description: "Digital health card" },
      { name: "Appointments", description: "Schedule medical appointments" },
      { name: "Medications", description: "Prescribed medications" },
      { name: "Hospitals", description: "Nearby hospitals and clinics" },
      { name: "Lab Results", description: "Laboratory test results" },
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
        flow: "Main",
        order: index,
        airtableId: `screen${index + 1}`,
        createdAt: now,
        updatedAt: now,
      });
    });
    
    // Create sample screens for the second app (Carteira de Trabalho Digital)
    const ctpsScreenTypes = [
      { name: "Welcome", description: "App introduction screen" },
      { name: "Registration", description: "User registration" },
      { name: "Work History", description: "Employment history view" },
      { name: "Current Job", description: "Current employment details" },
      { name: "Benefits", description: "Employment benefits" },
      { name: "Documents", description: "Digital work documents" },
      { name: "Notifications", description: "System notifications" },
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
        flow: "Main",
        order: index,
        airtableId: `ctps${index + 1}`,
        createdAt: now,
        updatedAt: now,
      });
    });
  }
}

// Create and export the storage instance
export const storage = new MemStorage();
