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
    const now = new Date().toISOString();
    
    const app: App = {
      ...insertApp,
      id,
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
    const now = new Date().toISOString();
    
    const screen: Screen = {
      ...insertScreen,
      id,
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

  // Airtable Sync
  async syncFromAirtable(apiKey: string, baseId: string): Promise<void> {
    try {
      // In a real implementation, this would fetch data from Airtable
      // and update the local data store
      console.log(`Syncing data from Airtable base ${baseId} with API key ${apiKey.substring(0, 3)}...`);
      
      // Example of how the implementation would work:
      // 1. Fetch apps from Airtable
      const appsResponse = await axios.get(
        `https://api.airtable.com/v0/${baseId}/apps`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      
      // 2. Process and store apps
      for (const record of appsResponse.data.records) {
        const appData = {
          name: record.fields.name,
          description: record.fields.description,
          thumbnailUrl: record.fields.thumbnailUrl,
          logo: record.fields.logo,
          type: record.fields.type,
          category: record.fields.category,
          platform: record.fields.platform,
          language: record.fields.language,
          screenCount: 0,
          url: record.fields.url,
          airtableId: record.id,
        };
        
        // Check if app already exists
        const existingApp = Array.from(this.apps.values())
          .find(app => app.airtableId === record.id);
        
        if (existingApp) {
          // Update existing app
          this.apps.set(existingApp.id, {
            ...existingApp,
            ...appData,
            updatedAt: new Date().toISOString()
          });
        } else {
          // Create new app
          await this.createApp(appData);
        }
      }
      
      // 3. Fetch screens from Airtable
      const screensResponse = await axios.get(
        `https://api.airtable.com/v0/${baseId}/screens`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      
      // 4. Process and store screens
      for (const record of screensResponse.data.records) {
        // Find the app id by airtable id
        const app = Array.from(this.apps.values())
          .find(app => app.airtableId === record.fields.appId);
        
        if (app) {
          const screenData = {
            appId: app.id,
            name: record.fields.name,
            description: record.fields.description || "",
            imageUrl: record.fields.imageUrl,
            flow: record.fields.flow,
            order: record.fields.order || 0,
            airtableId: record.id,
          };
          
          // Check if screen already exists
          const existingScreen = Array.from(this.screens.values())
            .find(screen => screen.airtableId === record.id);
          
          if (existingScreen) {
            // Update existing screen
            this.screens.set(existingScreen.id, {
              ...existingScreen,
              ...screenData,
              updatedAt: new Date().toISOString()
            });
          } else {
            // Create new screen
            await this.createScreen(screenData);
          }
        }
      }
      
      // 5. Update screen counts for all apps
      for (const [id, app] of this.apps.entries()) {
        const screensCount = Array.from(this.screens.values())
          .filter(screen => screen.appId === app.id)
          .length;
        
        app.screenCount = screensCount;
        this.apps.set(id, app);
      }
      
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
      const now = new Date().toISOString();
      
      this.apps.set(id, {
        ...app,
        id,
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
      const now = new Date().toISOString();
      
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
      const now = new Date().toISOString();
      
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
