import { Client } from "@notionhq/client";

// Initialize Notion client
export const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET!,
});

// Extract the page ID from the Notion page URL
function extractPageIdFromUrl(pageUrl: string): string {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
        return match[1];
    }

    throw Error("Failed to extract page ID");
}

export const NOTION_PAGE_ID = extractPageIdFromUrl(process.env.NOTION_PAGE_URL!);

/**
 * Lists all child databases contained within NOTION_PAGE_ID
 * @returns {Promise<Array<{id: string, title: any}>>} - Array of database objects with id and title
 */
export async function getNotionDatabases() {
    // Array to store the child databases
    const childDatabases: any[] = [];

    try {
        // Query all child blocks in the specified page
        let hasMore = true;
        let startCursor: string | undefined = undefined;

        while (hasMore) {
            const response = await notion.blocks.children.list({
                block_id: NOTION_PAGE_ID,
                start_cursor: startCursor,
            });

            // Process the results
            for (const block of response.results) {
                // Check if the block is a child database
                if ((block as any).type === "child_database") {
                    const databaseId = block.id;

                    // Retrieve the database title
                    try {
                        const databaseInfo = await notion.databases.retrieve({
                            database_id: databaseId,
                        });

                        // Add the database to our list
                        childDatabases.push(databaseInfo);
                    } catch (error) {
                        console.error(`Error retrieving database ${databaseId}:`, error);
                    }
                }
            }

            // Check if there are more results to fetch
            hasMore = response.has_more;
            startCursor = response.next_cursor || undefined;
        }

        return childDatabases;
    } catch (error) {
        console.error("Error listing child databases:", error);
        throw error;
    }
}

// Find a Notion database with the matching title
export async function findDatabaseByTitle(title: string) {
    const databases = await getNotionDatabases();

    for (const db of databases) {
        const dbTitle = (db as any).title?.[0]?.plain_text?.toLowerCase() || "";
        if (dbTitle === title.toLowerCase()) {
            return db;
        }
    }

    return null;
}

// Create a new database if one with a matching title does not exist
export async function createDatabaseIfNotExists(title: string, properties: any) {
    const existingDb = await findDatabaseByTitle(title);
    if (existingDb) {
        return existingDb;
    }
    return await notion.databases.create({
        parent: {
            type: "page_id",
            page_id: NOTION_PAGE_ID
        },
        title: [
            {
                type: "text",
                text: {
                    content: title
                }
            }
        ],
        properties
    });
}

// Get all apps from the Notion database
export async function getApps(appsDatabaseId: string) {
    try {
        const response = await notion.databases.query({
            database_id: appsDatabaseId,
        });

        return response.results.map((page: any) => {
            const properties = page.properties;

            return {
                notionId: page.id,
                name: properties.Name?.title?.[0]?.plain_text || "Untitled App",
                description: properties.Description?.rich_text?.[0]?.plain_text || "",
                category: properties.Category?.select?.name || "Uncategorized",
                type: properties.Type?.select?.name || null,
                logo: properties.Logo?.files?.[0]?.file?.url || properties.Logo?.files?.[0]?.external?.url || null,
                createdAt: new Date(page.created_time),
            };
        });
    } catch (error) {
        console.error("Error fetching apps from Notion:", error);
        throw new Error("Failed to fetch apps from Notion");
    }
}

// Get all screens from the Notion database
export async function getScreens(screensDatabaseId: string) {
    try {
        const response = await notion.databases.query({
            database_id: screensDatabaseId,
        });

        return response.results.map((page: any) => {
            const properties = page.properties;

            return {
                notionId: page.id,
                title: properties.Title?.title?.[0]?.plain_text || "Untitled Screen",
                appId: properties.AppId?.number || null,
                appName: properties.AppName?.select?.name || null,
                image: properties.Image?.files?.[0]?.file?.url || properties.Image?.files?.[0]?.external?.url || null,
                createdAt: new Date(page.created_time),
            };
        });
    } catch (error) {
        console.error("Error fetching screens from Notion:", error);
        throw new Error("Failed to fetch screens from Notion");
    }
}

// Get document content from a Notion page
export async function getDocumentContent(pageId: string) {
    try {
        const response = await notion.blocks.children.list({
            block_id: pageId,
        });

        let content = "";
        for (const block of response.results) {
            const blockData = block as any;
            
            if (blockData.type === "paragraph") {
                const textContent = blockData.paragraph?.rich_text?.map((text: any) => text.plain_text).join("") || "";
                content += textContent + "\n\n";
            } else if (blockData.type === "heading_1") {
                const headingText = blockData.heading_1?.rich_text?.map((text: any) => text.plain_text).join("") || "";
                content += "# " + headingText + "\n\n";
            } else if (blockData.type === "heading_2") {
                const headingText = blockData.heading_2?.rich_text?.map((text: any) => text.plain_text).join("") || "";
                content += "## " + headingText + "\n\n";
            } else if (blockData.type === "heading_3") {
                const headingText = blockData.heading_3?.rich_text?.map((text: any) => text.plain_text).join("") || "";
                content += "### " + headingText + "\n\n";
            } else if (blockData.type === "bulleted_list_item") {
                const listText = blockData.bulleted_list_item?.rich_text?.map((text: any) => text.plain_text).join("") || "";
                content += "- " + listText + "\n";
            } else if (blockData.type === "numbered_list_item") {
                const listText = blockData.numbered_list_item?.rich_text?.map((text: any) => text.plain_text).join("") || "";
                content += "1. " + listText + "\n";
            }
        }

        return content;
    } catch (error) {
        console.error("Error fetching document content from Notion:", error);
        throw new Error("Failed to fetch document content from Notion");
    }
}