import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppSchema, insertScreenSchema } from "@shared/schema";
import { z } from "zod";
import { subscribeToNewsletter, getNewsletterSubscribers } from "./newsletter";
import axios from "axios";
import cors from "cors";
import sharp from "sharp";
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { startMigration, getCloudinaryStatus, testCloudinaryUpload } from "./cloudinary-controller";


export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS for all routes
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Create routes for SEO files
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /proxy-image/
Disallow: /api/

# Sitemap
Sitemap: https://designpublico.com.br/sitemap.xml

# Crawl delay
Crawl-delay: 2`);
  });
  
  app.get('/sitemap.xml', async (req, res) => {
    try {
      // Buscar todos os apps para incluir no sitemap
      const apps = await storage.getApps();
      
      let sitemapContent = '<?xml version="1.0" encoding="UTF-8"?>';
      sitemapContent += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
      
      // Páginas principais
      sitemapContent += `
        <url>
          <loc>https://designpublico.com.br/</loc>
          <changefreq>weekly</changefreq>
          <priority>1.0</priority>
        </url>
        <url>
          <loc>https://designpublico.com.br/screens</loc>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
        <url>
          <loc>https://designpublico.com.br/about</loc>
          <changefreq>monthly</changefreq>
          <priority>0.7</priority>
        </url>
      `;
      
      // Adicionar URLs para cada app
      for (const app of apps) {
        // Usar nome convertido para slug ou id
        const slug = app.name.toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remover caracteres especiais
          .replace(/\s+/g, '-') // Substituir espaços por hífens
          .replace(/--+/g, '-') // Substituir múltiplos hífens por um único
          || app.id.toString();
        sitemapContent += `
          <url>
            <loc>https://designpublico.com.br/app/${slug}</loc>
            <changefreq>monthly</changefreq>
            <priority>0.6</priority>
          </url>
        `;
      }
      
      sitemapContent += '</urlset>';
      
      res.type('application/xml');
      res.send(sitemapContent);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // File system cache utility for images
  
  // Create cache directory if it doesn't exist
  const CACHE_DIR = './.image-cache';
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  
  // Function to get cached image path
  const getCachedImagePath = (cacheKey: string) => {
    const hash = crypto.createHash('md5').update(cacheKey).digest('hex');
    return path.join(CACHE_DIR, `${hash}.bin`);
  };
  
  // Check if image exists in cache
  const getImageFromCache = (cacheKey: string) => {
    const cachedFilePath = getCachedImagePath(cacheKey);
    
    if (fs.existsSync(cachedFilePath)) {
      try {
        // Get file stats to check age
        const stats = fs.statSync(cachedFilePath);
        const fileAgeDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
        
        // If file is older than 30 days, consider it expired
        if (fileAgeDays > 30) {
          return null;
        }
        
        // Read metadata from the first line and content from the rest
        const fileContent = fs.readFileSync(cachedFilePath);
        const metadataEndIndex = fileContent.indexOf('\n');
        
        if (metadataEndIndex !== -1) {
          const metadata = JSON.parse(fileContent.slice(0, metadataEndIndex).toString());
          const imageData = fileContent.slice(metadataEndIndex + 1);
          
          return { metadata, imageData };
        }
      } catch (error: any) {
        console.error(`Error reading from cache: ${error.message}`);
      }
    }
    
    return null;
  };
  
  // Save image to cache
  const saveImageToCache = (cacheKey: string, imageData: Buffer, metadata: any) => {
    try {
      const cachedFilePath = getCachedImagePath(cacheKey);
      
      // Store metadata in the first line, followed by image data
      const metadataStr = JSON.stringify(metadata) + '\n';
      const fileContent = Buffer.concat([
        Buffer.from(metadataStr),
        imageData
      ]);
      
      fs.writeFileSync(cachedFilePath, fileContent);
    } catch (error: any) {
      console.error(`Error saving to cache: ${error.message}`);
    }
  };

  // Proxy for Airtable images with optimization
  app.get("/proxy-image/*", async (req, res) => {
    try {
      const imagePath = req.path.replace("/proxy-image", "");
      
      // Parse query parameters for image optimization
      let width = parseInt(req.query.width as string) || null;
      let height = parseInt(req.query.height as string) || null;
      const format = (req.query.format as string) || null;
      let quality = parseInt(req.query.quality as string) || 80;
      const isPriority = req.query.priority === 'true';
      
      console.log(`Proxying image: ${imagePath}, width: ${width}, format: ${format}`);
      
      // Limit maximum size to avoid overly large images
      if (width && width > 1000) {
        const originalWidth = width;
        width = 1000;
        if (originalWidth > 1500 && quality > 75) {
          quality = 75;
        }
      }
      
      // Check if browser supports WebP/AVIF
      const acceptHeader = req.headers.accept || '';
      const supportsWebP = acceptHeader.includes('image/webp');
      const supportsAvif = acceptHeader.includes('image/avif');
      
      // Use the most efficient format supported by the browser
      let outputFormat = format;
      if (!outputFormat || outputFormat === 'auto') {
        if (supportsAvif) {
          outputFormat = 'avif';
          if (quality > 70) quality = 70;
        } else if (supportsWebP) {
          outputFormat = 'webp';
          if (quality > 80) quality = 80;
        } else {
          outputFormat = 'jpeg';
        }
      }
      
      // Generate cache key for this resource
      const cacheKey = `${imagePath}-${width || 'orig'}-${height || 'orig'}-${outputFormat}-${quality}`;
      const etag = `"${Buffer.from(cacheKey).toString('base64')}"`;
      
      // Check if the browser already has this version cached
      if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return;
      }
      
      // Check if we have this image in our server cache
      const cachedImage = getImageFromCache(cacheKey);
      
      if (cachedImage) {
        // Use the cached version
        console.log(`Using cached image for: ${imagePath}`);
        
        // Serve the cached image with appropriate headers
        res.set('Content-Type', cachedImage.metadata.contentType);
        res.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
        res.set('ETag', etag);
        res.set('Vary', 'Accept');
        res.set('X-Cache', 'HIT');
        
        // Priority headers if needed
        if (isPriority) {
          res.set('Priority', 'high');
          res.set('Importance', 'high');
        }
        
        res.send(cachedImage.imageData);
        return;
      }
      
      // Cache miss - fetch from Airtable
      // Construct the Airtable URL
      let airtableUrl = imagePath.startsWith('https://') 
        ? imagePath  // Use the full URL as provided
        : `https://v5.airtableusercontent.com${imagePath}`; // Add the base domain
      
      console.log(`Fetching Airtable image from: ${airtableUrl}`);
      
      const response = await axios.get(airtableUrl, {
        responseType: 'arraybuffer',
        headers: {
          'Accept': 'image/*',
          'Cache-Control': 'no-cache'
        }
      });
      
      // Get the original image data
      const originalImageData = response.data;
      const originalContentType = response.headers['content-type'] as string;
      
      // Save the original image to cache for future use
      saveImageToCache(`${imagePath}-original`, originalImageData, { 
        contentType: originalContentType,
        fetchDate: new Date().toISOString()
      });
      
      // Process the image if needed (resize/format conversion)
      if ((width || height) || (outputFormat && outputFormat !== 'original')) {
        let imageProcessor = sharp(originalImageData);
        
        // Get image metadata for resizing
        const metadata = await imageProcessor.metadata();
        const origWidth = metadata.width || 0;
        const origHeight = metadata.height || 0;
        
        // Calculate dimensions to maintain aspect ratio
        let resizeOptions: sharp.ResizeOptions = {
          fit: 'inside',
          withoutEnlargement: true
        };
        
        if (width && height) {
          // Both dimensions specified
          resizeOptions.width = width;
          resizeOptions.height = height;
        } else if (width) {
          // Only width specified, calculate height
          resizeOptions.width = width;
          if (origWidth > 0 && origHeight > 0) {
            resizeOptions.height = Math.round((width * origHeight) / origWidth);
          }
        } else if (height) {
          // Only height specified, calculate width
          resizeOptions.height = height;
          if (origWidth > 0 && origHeight > 0) {
            resizeOptions.width = Math.round((height * origWidth) / origHeight);
          }
        }
        
        // Apply resize if needed
        if (width || height) {
          imageProcessor = imageProcessor.resize(resizeOptions);
        }
        
        // Set the output format and content type
        let processedContentType = originalContentType;
        
        // Apply format conversion if requested
        switch (outputFormat) {
          case 'webp':
            imageProcessor = imageProcessor.webp({ 
              quality, 
              effort: 4,
              smartSubsample: true,
              nearLossless: quality > 90
            });
            processedContentType = 'image/webp';
            break;
          case 'avif':
            imageProcessor = imageProcessor.avif({ 
              quality, 
              effort: 7,
              chromaSubsampling: '4:2:0'
            });
            processedContentType = 'image/avif';
            break;
          case 'jpeg':
          case 'jpg':
            imageProcessor = imageProcessor.jpeg({ 
              quality,
              progressive: true,
              optimizeScans: true,
              mozjpeg: true
            });
            processedContentType = 'image/jpeg';
            break;
          case 'png':
            imageProcessor = imageProcessor.png({ 
              quality,
              compressionLevel: 9,
              palette: true
            });
            processedContentType = 'image/png';
            break;
        }
        
        // Process the image
        const optimizedImageBuffer = await imageProcessor.toBuffer();
        
        // Save the transformed image to cache
        saveImageToCache(cacheKey, optimizedImageBuffer, { 
          contentType: processedContentType,
          processedAt: new Date().toISOString(),
          width: width || 'original',
          height: height || 'original',
          format: outputFormat || 'original',
          quality: quality
        });
        
        // Send the processed image
        res.set('Content-Type', processedContentType);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('ETag', etag);
        res.set('Vary', 'Accept');
        res.set('X-Cache', 'MISS');
        
        if (isPriority) {
          res.set('Priority', 'high');
          res.set('Importance', 'high');
        }
        
        res.send(optimizedImageBuffer);
      } else {
        // No transformation needed, serve as-is
        res.set('Content-Type', originalContentType);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('ETag', etag);
        res.set('Vary', 'Accept');
        res.set('X-Cache', 'MISS');
        
        if (isPriority) {
          res.set('Priority', 'high');
          res.set('Importance', 'high');
        }
        
        res.send(originalImageData);
      }
    } catch (error: any) {
      // Extract error details
      const errorMessage = error.message || 'Unknown error';
      const errorStack = error.stack || '';
      const errorStatus = error.response?.status || 'No status';
      const errorData = error.response?.data ? 'Data available' : 'No data';
      
      console.error("Error proxying Airtable image:", {
        path: req.path,
        error: errorMessage,
        status: errorStatus,
        data: errorData,
        stack: errorStack
      });
      
      // Send a transparent fallback image, but with a 200 status so the UI can still function
      // This allows the app to continue displaying even if some images fail
      const fallbackImage = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-store, max-age=0');
      // Using 200 status instead of 500 to allow client to continue normally
      res.set('X-Image-Error', 'true');
      res.set('X-Error-Message', errorMessage.substring(0, 100));
      res.status(200).send(fallbackImage);
    }
  });
  // Setup Airtable API key
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "";
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "";

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn("Airtable API key or base ID not provided. Using mock data.");
  } else {
    console.log("Airtable credentials detected. Attempting to sync data...");
    try {
      await storage.syncFromAirtable(AIRTABLE_API_KEY, AIRTABLE_BASE_ID);
      console.log("Initial Airtable sync completed successfully.");
      
      // Background sync is already set up elsewhere
    } catch (error) {
      console.error("Failed to perform initial Airtable sync:", error);
    }
  }

  // Notion helper functions are imported at the top of the file

  // Get all apps
  app.get("/api/apps", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const platform = req.query.platform as string | undefined;
      const search = req.query.search as string | undefined;

      // Get all apps from the regular storage
      let apps = await storage.getApps({ type, platform, search });
      
      // Add planned apps manually for demo purposes
      const plannedApps = [
        {
          id: 101,
          name: "Jusbrasil",
          description: "Aplicativo para consulta de processos jurídicos e acompanhamento de ações.",
          thumbnailUrl: "https://via.placeholder.com/300x200?text=Jusbrasil",
          logo: "https://via.placeholder.com/100x100?text=JB",
          cloudinaryLogo: null,
          type: "Federal",
          category: "Cidadania",
          platform: "Cross-platform",
          language: "Portuguese",
          screenCount: 0,
          url: "https://example.com/jusbrasil",
          slug: "jusbrasil",
          status: "Planejado",
          airtableId: "rec14",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 102,
          name: "Resultados",
          description: "Aplicativo para consulta de resultados de exames e laudos médicos.",
          thumbnailUrl: "https://via.placeholder.com/300x200?text=Resultados",
          logo: "https://via.placeholder.com/100x100?text=RE",
          cloudinaryLogo: null,
          type: "Federal",
          category: "Saúde",
          platform: "iOS",
          language: "Portuguese",
          screenCount: 0,
          url: "https://example.com/resultados",
          slug: "resultados",
          status: "Planejado",
          airtableId: "rec15",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 103,
          name: "MEI Fácil",
          description: "Aplicativo para microempreendedores individuais gerenciarem suas obrigações fiscais.",
          thumbnailUrl: "https://via.placeholder.com/300x200?text=MEI+Fácil", 
          logo: "https://via.placeholder.com/100x100?text=MEI",
          cloudinaryLogo: null,
          type: "Federal",
          category: "Finanças",
          platform: "Cross-platform",
          language: "Portuguese",
          screenCount: 0,
          url: "https://example.com/meifacil",
          slug: "mei-facil",
          status: "Planejado",
          airtableId: "rec17",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Combine regular apps with planned apps
      const allApps = [...apps, ...plannedApps];
      
      // Log the complete list of apps for debugging
      console.log(`Returning ${allApps.length} apps from storage (${apps.length} regular + ${plannedApps.length} planned)`);
      console.log(`App statuses: ${allApps.map(app => app.status).join(', ')}`);
      
      // Return all apps including those with "Planejado" status
      return res.json(allApps);
      
      // This code is now unreachable since we return above, but keeping for reference
      // If process.env.NOTION_INTEGRATION_SECRET && process.env.NOTION_PAGE_URL {
      //   try {
      //     console.log("No apps found in primary storage, trying Notion...");
      //     // This would use the imported fetchAppsFromNotion if it's available
      //   } catch (err) {
      //     console.error("Error fetching from Notion:", err);
      //   }
      // }
    } catch (error) {
      console.error("Error fetching apps:", error);
      res.status(500).json({ message: "Failed to fetch apps" });
    }
  });

  // Get app by ID ou Slug
  app.get("/api/apps/:idOrSlug", async (req, res) => {
    try {
      const idOrSlug = req.params.idOrSlug;
      const id = parseInt(idOrSlug);
      
      let app;
      
      // Tentar buscar por ID se for um número
      if (!isNaN(id)) {
        app = await storage.getAppById(id);
      } else {
        // Se não for um número, tentar buscar por slug
        app = await storage.getAppBySlug(idOrSlug);
      }
      
      if (!app) {
        return res.status(404).json({ message: "App not found" });
      }

      res.json(app);
    } catch (error) {
      console.error("Error fetching app:", error);
      res.status(500).json({ message: "Failed to fetch app" });
    }
  });

  // Get screens for an app (by ID or slug)
  app.get("/api/apps/:idOrSlug/screens", async (req, res) => {
    try {
      const idOrSlug = req.params.idOrSlug;
      const id = parseInt(idOrSlug);
      let appId;
      
      if (!isNaN(id)) {
        // É um ID numérico
        appId = id;
      } else {
        // É um slug, precisamos encontrar o app primeiro
        const app = await storage.getAppBySlug(idOrSlug);
        if (!app) {
          return res.status(404).json({ message: "App not found" });
        }
        appId = app.id;
      }

      const screens = await storage.getScreensByAppId(appId);
      res.json(screens);
    } catch (error) {
      console.error("Error fetching screens:", error);
      res.status(500).json({ message: "Failed to fetch screens" });
    }
  });

  // Sync data from Airtable
  app.post("/api/sync", async (req, res) => {
    try {
      if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
        return res.status(400).json({ message: "Airtable API key or base ID not configured" });
      }

      await storage.syncFromAirtable(AIRTABLE_API_KEY, AIRTABLE_BASE_ID);
      res.json({ message: "Sync completed successfully" });
    } catch (error) {
      console.error("Error syncing from Airtable:", error);
      res.status(500).json({ message: "Failed to sync from Airtable" });
    }
  });

  // Create a new app
  app.post("/api/apps", async (req, res) => {
    try {
      const appData = insertAppSchema.parse(req.body);
      const app = await storage.createApp(appData);
      res.status(201).json(app);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid app data", errors: error.errors });
      }
      console.error("Error creating app:", error);
      res.status(500).json({ message: "Failed to create app" });
    }
  });

  // Create a new screen
  app.post("/api/screens", async (req, res) => {
    try {
      const screenData = insertScreenSchema.parse(req.body);
      const screen = await storage.createScreen(screenData);
      res.status(201).json(screen);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid screen data", errors: error.errors });
      }
      console.error("Error creating screen:", error);
      res.status(500).json({ message: "Failed to create screen" });
    }
  });

  // Get brand logo
  app.get("/api/brand/logo", async (req, res) => {
    try {
      const logoUrl = await storage.getBrandLogo();
      if (!logoUrl) {
        return res.status(404).json({ message: "Logo not found" });
      }
      res.json({ url: logoUrl });
    } catch (error) {
      console.error("Error fetching brand logo:", error);
      res.status(500).json({ message: "Failed to fetch brand logo" });
    }
  });

  // Newsletter subscription endpoints
  app.post("/api/newsletter/subscribe", subscribeToNewsletter);
  app.get("/api/newsletter/subscribers", getNewsletterSubscribers);

  // Cloudinary Migration Routes
  app.get("/api/cloudinary/status", getCloudinaryStatus);
  
  // Get document content from Airtable docs table
  app.get("/api/docs/:pageTitle", async (req, res) => {
    try {
      // Force the response to be JSON to avoid catching HTML from client-side routing
      res.setHeader('Content-Type', 'application/json');
      
      const { pageTitle } = req.params;
      
      // Configure Airtable API
      const airtableApiKey = process.env.AIRTABLE_API_KEY;
      const airtableBaseId = process.env.AIRTABLE_BASE_ID;
      
      if (!airtableApiKey || !airtableBaseId) {
        return res.status(500).json({
          error: 'Configuration error',
          message: 'Airtable credentials are missing'
        });
      }
      
      console.log(`Fetching document "${pageTitle}" from Airtable`);
      
      // Fetch document from Airtable
      const url = `https://api.airtable.com/v0/${airtableBaseId}/docs`;
      const response = await axios.get(url, {
        params: {
          filterByFormula: `{page-title} = "${pageTitle}"`,
          maxRecords: 1
        },
        headers: {
          Authorization: `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data.records || response.data.records.length === 0) {
        console.log(`Document "${pageTitle}" not found in Airtable`);
        return res.status(404).json({
          error: 'Not found',
          message: `Document "${pageTitle}" not found`
        });
      }
      
      const document = response.data.records[0];
      console.log(`Successfully retrieved document: ${document.id}`);
      
      // Build response object
      const result = {
        id: document.id,
        title: document.fields['page-title'],
        content: document.fields['doc-text'] || '',
        status: document.fields['status'] || 'unknown'
      };
      
      // Return document content
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error fetching document:', error.message);
      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to fetch document from Airtable'
      });
    }
  });
  app.post("/api/cloudinary/test-upload", testCloudinaryUpload);
  app.post("/api/cloudinary/migrate", startMigration);

  const httpServer = createServer(app);
  return httpServer;
}