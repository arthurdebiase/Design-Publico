import { Client } from "@notionhq/client";
import { notion, NOTION_PAGE_ID, createDatabaseIfNotExists, findDatabaseByTitle } from "./notion";
import { storage } from "./storage";

// Environment variables validation
if (!process.env.NOTION_INTEGRATION_SECRET) {
    throw new Error("NOTION_INTEGRATION_SECRET is not defined. Please add it to your environment variables.");
}

if (!process.env.NOTION_PAGE_URL) {
    throw new Error("NOTION_PAGE_URL is not defined. Please add it to your environment variables.");
}

// Setup databases for our design gallery application
async function setupNotionDatabases() {
    console.log("Setting up Notion databases...");
    
    // Create Apps database
    const appsDb = await createDatabaseIfNotExists("Apps", {
        Name: {
            title: {}
        },
        Description: {
            rich_text: {}
        },
        Category: {
            select: {
                options: [
                    { name: "Cidadania", color: "blue" },
                    { name: "Finanças", color: "green" },
                    { name: "Logística", color: "orange" },
                    { name: "Portal", color: "purple" },
                    { name: "Saúde", color: "red" },
                    { name: "Trabalho", color: "yellow" }
                ]
            }
        },
        Type: {
            select: {
                options: [
                    { name: "App", color: "blue" },
                    { name: "Website", color: "green" }
                ]
            }
        },
        Logo: {
            files: {}
        }
    });
    
    // Create Screens database
    const screensDb = await createDatabaseIfNotExists("Screens", {
        Title: {
            title: {}
        },
        AppId: {
            number: {}
        },
        AppName: {
            select: {
                options: [] // Will be populated with app names
            }
        },
        Image: {
            files: {}
        }
    });
    
    // Create Documents database
    await createDatabaseIfNotExists("Documents", {
        Title: {
            title: {}
        },
        Type: {
            select: {
                options: [
                    { name: "Terms", color: "blue" },
                    { name: "Privacy", color: "green" },
                    { name: "About", color: "purple" }
                ]
            }
        },
        Content: {
            rich_text: {}
        }
    });
    
    console.log("Notion databases created successfully!");
    return { appsDb, screensDb };
}

// Migrate data from Airtable to Notion
async function migrateDataFromAirtable() {
    try {
        console.log("Starting data migration from Airtable to Notion...");
        
        // Check for required Airtable credentials
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
        
        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
            console.error("Airtable API key or base ID not provided. Migration cannot proceed.");
            return;
        }
        
        // Setup Notion databases
        const { appsDb, screensDb } = await setupNotionDatabases();
        
        // Get data from Airtable
        await storage.syncFromAirtable(AIRTABLE_API_KEY, AIRTABLE_BASE_ID);
        const apps = storage.getApps();
        const screens = storage.getScreens();
        
        console.log(`Found ${apps.length} apps and ${screens.length} screens in Airtable.`);
        
        // Migrate apps to Notion
        let appCount = 0;
        for (const app of apps) {
            try {
                // Check if app already exists in Notion by matching name
                const response = await notion.databases.query({
                    database_id: appsDb.id,
                    filter: {
                        property: "Name",
                        title: {
                            equals: app.name
                        }
                    }
                });
                
                if (response.results.length === 0) {
                    // Create new app in Notion
                    await notion.pages.create({
                        parent: {
                            database_id: appsDb.id
                        },
                        properties: {
                            Name: {
                                title: [
                                    {
                                        text: {
                                            content: app.name
                                        }
                                    }
                                ]
                            },
                            Category: app.category ? {
                                select: {
                                    name: app.category
                                }
                            } : undefined,
                            Type: app.type ? {
                                select: {
                                    name: app.type
                                }
                            } : undefined,
                            Logo: app.cloudinaryLogo ? {
                                files: [
                                    {
                                        name: "logo",
                                        external: {
                                            url: app.cloudinaryLogo
                                        }
                                    }
                                ]
                            } : undefined
                        }
                    });
                    appCount++;
                    
                    // Rate limit to avoid hitting Notion API limits (3 requests per second)
                    await new Promise(resolve => setTimeout(resolve, 350));
                }
            } catch (error) {
                console.error(`Error migrating app ${app.name}:`, error);
            }
        }
        
        // Migrate screens to Notion
        let screenCount = 0;
        for (const screen of screens) {
            try {
                // Find the related app
                const app = apps.find(a => a.id === screen.appId);
                
                if (!app) continue;
                
                // Check if screen already exists in Notion by matching title and appId
                const response = await notion.databases.query({
                    database_id: screensDb.id,
                    filter: {
                        and: [
                            {
                                property: "Title",
                                title: {
                                    equals: screen.title
                                }
                            },
                            {
                                property: "AppId",
                                number: {
                                    equals: screen.appId
                                }
                            }
                        ]
                    }
                });
                
                if (response.results.length === 0) {
                    // Create new screen in Notion
                    await notion.pages.create({
                        parent: {
                            database_id: screensDb.id
                        },
                        properties: {
                            Title: {
                                title: [
                                    {
                                        text: {
                                            content: screen.title
                                        }
                                    }
                                ]
                            },
                            AppId: {
                                number: screen.appId
                            },
                            AppName: {
                                select: {
                                    name: app.name
                                }
                            },
                            Image: screen.cloudinaryUrl ? {
                                files: [
                                    {
                                        name: "screen",
                                        external: {
                                            url: screen.cloudinaryUrl
                                        }
                                    }
                                ]
                            } : undefined
                        }
                    });
                    screenCount++;
                    
                    // Rate limit to avoid hitting Notion API limits
                    await new Promise(resolve => setTimeout(resolve, 350));
                    
                    // Log progress every 10 screens
                    if (screenCount % 10 === 0) {
                        console.log(`Migrated ${screenCount} screens so far...`);
                    }
                }
            } catch (error) {
                console.error(`Error migrating screen ${screen.title}:`, error);
            }
        }
        
        console.log(`Migration complete! Migrated ${appCount} apps and ${screenCount} screens to Notion.`);
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

// Create a simplified document page in Notion
async function createDocumentPage(title: string, type: string, content: string) {
    try {
        // Find the Documents database
        const docsDb = await findDatabaseByTitle("Documents");
        
        if (!docsDb) {
            console.error("Documents database not found in Notion");
            return;
        }
        
        // Check if document already exists
        const response = await notion.databases.query({
            database_id: docsDb.id,
            filter: {
                and: [
                    {
                        property: "Title",
                        title: {
                            equals: title
                        }
                    },
                    {
                        property: "Type",
                        select: {
                            equals: type
                        }
                    }
                ]
            }
        });
        
        if (response.results.length === 0) {
            // Create new document in Notion
            const page = await notion.pages.create({
                parent: {
                    database_id: docsDb.id
                },
                properties: {
                    Title: {
                        title: [
                            {
                                text: {
                                    content: title
                                }
                            }
                        ]
                    },
                    Type: {
                        select: {
                            name: type
                        }
                    }
                },
                children: [
                    {
                        object: "block",
                        type: "paragraph",
                        paragraph: {
                            rich_text: [
                                {
                                    type: "text",
                                    text: {
                                        content
                                    }
                                }
                            ]
                        }
                    }
                ]
            });
            
            console.log(`Created document page: ${title}`);
            return page;
        } else {
            console.log(`Document ${title} already exists, skipping creation`);
        }
    } catch (error) {
        console.error(`Error creating document page ${title}:`, error);
    }
}

// Run the setup and migration
async function run() {
    try {
        await setupNotionDatabases();
        await migrateDataFromAirtable();
        
        // Create sample document pages
        await createDocumentPage(
            "Termos de Uso",
            "Terms",
            "# Termos de Uso\n\nBem-vindo ao Design Gallery. Ao utilizar nosso serviço, você concorda com estes termos."
        );
        
        await createDocumentPage(
            "Política de Privacidade",
            "Privacy",
            "# Política de Privacidade\n\nValorizamos sua privacidade. Esta política descreve como tratamos suas informações."
        );
        
        console.log("Setup completed successfully!");
    } catch (error) {
        console.error("Setup failed:", error);
    }
}

// Only run the script if executed directly (not imported)
if (require.main === module) {
    run();
}