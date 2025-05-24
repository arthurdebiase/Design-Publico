import { notion, NOTION_PAGE_ID, createDatabaseIfNotExists } from "./notion";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

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
    
    console.log("Created Apps database");
    
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
    
    console.log("Created Screens database");
    
    // Create Documents database
    const docsDb = await createDatabaseIfNotExists("Documents", {
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
    
    console.log("Created Documents database");
    
    return { appsDb, screensDb, docsDb };
}

// Create sample documents in Notion
async function createSampleDocuments(docsDbId: string) {
    console.log("Creating sample documents...");
    
    // Create Terms of Use document
    await notion.pages.create({
        parent: {
            database_id: docsDbId
        },
        properties: {
            Title: {
                title: [
                    {
                        text: {
                            content: "Termos de Uso"
                        }
                    }
                ]
            },
            Type: {
                select: {
                    name: "Terms"
                }
            },
        },
        children: [
            {
                object: "block",
                type: "heading_1",
                heading_1: {
                    rich_text: [
                        {
                            text: {
                                content: "Termos de Uso"
                            }
                        }
                    ]
                }
            },
            {
                object: "block",
                type: "paragraph",
                paragraph: {
                    rich_text: [
                        {
                            text: {
                                content: "Bem-vindo à Design Gallery, a plataforma que disponibiliza referências visuais para designers e desenvolvedores. Ao utilizar nossos serviços, você concorda com estes termos."
                            }
                        }
                    ]
                }
            },
            {
                object: "block",
                type: "heading_2",
                heading_2: {
                    rich_text: [
                        {
                            text: {
                                content: "1. Aceitação dos Termos"
                            }
                        }
                    ]
                }
            },
            {
                object: "block",
                type: "paragraph",
                paragraph: {
                    rich_text: [
                        {
                            text: {
                                content: "Ao acessar ou usar nossa plataforma, você concorda em cumprir estes Termos de Uso e todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site."
                            }
                        }
                    ]
                }
            },
            {
                object: "block",
                type: "heading_2",
                heading_2: {
                    rich_text: [
                        {
                            text: {
                                content: "2. Uso da Plataforma"
                            }
                        }
                    ]
                }
            },
            {
                object: "block",
                type: "paragraph",
                paragraph: {
                    rich_text: [
                        {
                            text: {
                                content: "Nossa plataforma oferece exemplos de interfaces e design para fins educacionais e de referência. As imagens e exemplos não devem ser utilizados para fins comerciais sem a devida autorização dos respectivos proprietários."
                            }
                        }
                    ]
                }
            }
        ]
    });
    
    console.log("Created Terms of Use document");
    
    // Create Privacy Policy document
    await notion.pages.create({
        parent: {
            database_id: docsDbId
        },
        properties: {
            Title: {
                title: [
                    {
                        text: {
                            content: "Política de Privacidade"
                        }
                    }
                ]
            },
            Type: {
                select: {
                    name: "Privacy"
                }
            },
        },
        children: [
            {
                object: "block",
                type: "heading_1",
                heading_1: {
                    rich_text: [
                        {
                            text: {
                                content: "Política de Privacidade"
                            }
                        }
                    ]
                }
            },
            {
                object: "block",
                type: "paragraph",
                paragraph: {
                    rich_text: [
                        {
                            text: {
                                content: "A Design Gallery valoriza a privacidade dos nossos usuários. Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações pessoais."
                            }
                        }
                    ]
                }
            },
            {
                object: "block",
                type: "heading_2",
                heading_2: {
                    rich_text: [
                        {
                            text: {
                                content: "1. Informações Coletadas"
                            }
                        }
                    ]
                }
            },
            {
                object: "block",
                type: "paragraph",
                paragraph: {
                    rich_text: [
                        {
                            text: {
                                content: "Coletamos informações básicas de uso e navegação para melhorar a experiência do usuário e aprimorar nossos serviços. Não coletamos informações pessoais identificáveis sem seu consentimento explícito."
                            }
                        }
                    ]
                }
            },
            {
                object: "block",
                type: "heading_2",
                heading_2: {
                    rich_text: [
                        {
                            text: {
                                content: "2. Uso de Cookies"
                            }
                        }
                    ]
                }
            },
            {
                object: "block",
                type: "paragraph",
                paragraph: {
                    rich_text: [
                        {
                            text: {
                                content: "Utilizamos cookies para melhorar a experiência do usuário, analisar o tráfego do site e personalizar conteúdo. Você pode controlar os cookies através das configurações do seu navegador."
                            }
                        }
                    ]
                }
            }
        ]
    });
    
    console.log("Created Privacy Policy document");
}

// Run the setup process
async function run() {
    try {
        const { appsDb, screensDb, docsDb } = await setupNotionDatabases();
        await createSampleDocuments(docsDb.id);
        console.log("Notion setup completed successfully!");
    } catch (error) {
        console.error("Error during Notion setup:", error);
    }
}

// Run the setup if this file is executed directly
if (require.main === module) {
    run().then(() => {
        console.log("Setup completed, exiting...");
        process.exit(0);
    }).catch(error => {
        console.error("Setup failed:", error);
        process.exit(1);
    });
}