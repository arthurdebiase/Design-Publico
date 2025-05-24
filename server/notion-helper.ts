import { Request, Response } from 'express';
import { notion, findDatabaseByTitle, getApps, getScreens, getDocumentContent } from './notion';

// Get all apps from Notion
export async function getAppsFromNotion(req: Request, res: Response) {
  try {
    // Find the Apps database
    const appsDb = await findDatabaseByTitle('Apps');
    
    if (!appsDb) {
      return res.status(404).json({ 
        message: 'Apps database not found in Notion',
        error: 'NOT_FOUND'
      });
    }

    // Get all apps from the database
    const apps = await getApps(appsDb.id);
    
    // Apply filters if provided
    const type = req.query.type as string | undefined;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    
    let filteredApps = [...apps];
    
    if (type) {
      filteredApps = filteredApps.filter(app => 
        app.type && app.type.toLowerCase() === type.toLowerCase()
      );
    }
    
    if (category) {
      filteredApps = filteredApps.filter(app => 
        app.category && app.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredApps = filteredApps.filter(app => 
        app.name.toLowerCase().includes(searchLower) || 
        (app.description && app.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Format apps to match the existing API format
    const formattedApps = filteredApps.map(app => ({
      id: app.notionId, // Using Notion ID as the app ID
      name: app.name,
      description: app.description || '',
      thumbnailUrl: app.logo || null,
      logo: app.logo || null,
      cloudinaryLogo: app.logo || null, // Notion already gives us permanent URLs
      type: app.type || 'App',
      category: app.category || 'Uncategorized',
      platform: 'Web', // Default platform
      url: null,
      language: null,
      version: null,
      country: null,
      createdAt: app.createdAt,
      updatedAt: app.createdAt
    }));
    
    return res.json(formattedApps);
  } catch (error) {
    console.error('Error fetching apps from Notion:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch apps from Notion',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}

// Helper function that doesn't use direct res/req
export async function fetchAppsFromNotion(params: {
  type?: string;
  category?: string;
  search?: string;
}) {
  try {
    // Find the Apps database
    const appsDb = await findDatabaseByTitle('Apps');
    
    if (!appsDb) {
      throw new Error('Apps database not found in Notion');
    }

    // Get all apps from the database
    const apps = await getApps(appsDb.id);
    
    // Apply filters if provided
    const { type, category, search } = params;
    
    let filteredApps = [...apps];
    
    if (type) {
      filteredApps = filteredApps.filter(app => 
        app.type && app.type.toLowerCase() === type.toLowerCase()
      );
    }
    
    if (category) {
      filteredApps = filteredApps.filter(app => 
        app.category && app.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredApps = filteredApps.filter(app => 
        app.name.toLowerCase().includes(searchLower) || 
        (app.description && app.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Format apps to match the existing API format
    return filteredApps.map(app => ({
      id: app.notionId, // Using Notion ID as the app ID
      name: app.name,
      description: app.description || '',
      thumbnailUrl: app.logo || null,
      logo: app.logo || null,
      cloudinaryLogo: app.logo || null, // Notion already gives us permanent URLs
      type: app.type || 'App',
      category: app.category || 'Uncategorized',
      platform: 'Web', // Default platform
      url: null,
      language: null,
      version: null,
      country: null,
      createdAt: app.createdAt,
      updatedAt: app.createdAt
    }));
  } catch (error) {
    console.error('Error fetching apps from Notion:', error);
    throw error;
  }
}

// Helper function for screens
export async function fetchScreensFromNotion(appId: string | number) {
  try {
    // Find the Screens database
    const screensDb = await findDatabaseByTitle('Screens');
    
    if (!screensDb) {
      throw new Error('Screens database not found in Notion');
    }
    
    // Get all screens from the database
    const allScreens = await getScreens(screensDb.id);
    
    // Filter screens by app ID
    const screens = allScreens.filter(screen => 
      screen.appId === appId || 
      (typeof appId === 'string' && screen.appId?.toString() === appId)
    );
    
    // Format screens to match the existing API format
    return screens.map(screen => ({
      id: screen.notionId, // Using Notion ID as the screen ID
      title: screen.title,
      appId: screen.appId,
      url: screen.image || null,
      cloudinaryUrl: screen.image || null, // Notion already gives us permanent URLs
      createdAt: screen.createdAt,
      updatedAt: screen.createdAt
    }));
  } catch (error) {
    console.error('Error fetching screens from Notion:', error);
    throw error;
  }
}

// Helper function for documents
export async function fetchDocumentFromNotion(docType: string) {
  try {
    // Find the Documents database
    const docsDb = await findDatabaseByTitle('Documents');
    
    if (!docsDb) {
      throw new Error('Documents database not found in Notion');
    }
    
    // Determine document title and type based on requested document type
    let title: string;
    let type: string;
    
    if (docType === 'terms') {
      title = 'Termos de Uso';
      type = 'Terms';
    } else if (docType === 'privacy') {
      title = 'Política de Privacidade';
      type = 'Privacy';
    } else {
      throw new Error('Invalid document type');
    }
    
    // Query the database for the document
    const response = await notion.databases.query({
      database_id: docsDb.id,
      filter: {
        and: [
          {
            property: 'Title',
            title: {
              equals: title
            }
          },
          {
            property: 'Type',
            select: {
              equals: type
            }
          }
        ]
      }
    });
    
    if (response.results.length === 0) {
      throw new Error(`${title} document not found`);
    }
    
    // Get the document content
    const pageId = response.results[0].id;
    const content = await getDocumentContent(pageId);
    
    return { 
      title,
      content,
      type: docType
    };
  } catch (error) {
    console.error('Error fetching document from Notion:', error);
    throw error;
  }
}