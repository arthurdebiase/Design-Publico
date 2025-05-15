import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppSchema, insertScreenSchema } from "@shared/schema";
import { z } from "zod";
import { subscribeToNewsletter, getNewsletterSubscribers } from "./newsletter";
import axios from "axios";
import cors from "cors";
import sharp from "sharp";

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

  // Proxy for Airtable images with optimization
  app.get("/proxy-image/*", async (req, res) => {
    try {
      const path = req.path.replace("/proxy-image", "");
      
      // Parse query parameters for image optimization
      let width = parseInt(req.query.width as string) || null;
      let height = parseInt(req.query.height as string) || null;
      const format = (req.query.format as string) || null;
      let quality = parseInt(req.query.quality as string) || 80;
      const isPriority = req.query.priority === 'true';
      
      console.log(`Proxying image: ${path}, width: ${width}, format: ${format}`);
      
      // Limite máximo de tamanho para evitar imagens muito grandes
      // O relatório do Lighthouse indica que estamos servindo imagens grandes demais
      if (width && width > 1000) {
        // Se a imagem for muito grande, reduzir para máximo de 1000px de largura
        // e ajustar a qualidade para baixo em imagens maiores (salvando bandwidth)
        const originalWidth = width;
        width = 1000;
        // Reduzir ainda mais a qualidade para imagens muito grandes
        if (originalWidth > 1500 && quality > 75) {
          quality = 75;
        }
      }
      
      // Check if browser supports WebP
      const acceptHeader = req.headers.accept || '';
      const supportsWebP = acceptHeader.includes('image/webp');
      const supportsAvif = acceptHeader.includes('image/avif');
      
      // Use the most efficient format supported by the browser
      // AVIF > WebP > JPEG in terms of compression efficiency
      let outputFormat = format;
      if (!outputFormat || outputFormat === 'auto') {
        if (supportsAvif) {
          outputFormat = 'avif';
          // AVIF permite qualidade menor com a mesma percepção visual
          if (quality > 70) quality = 70;
        } else if (supportsWebP) {
          outputFormat = 'webp';
          // WebP também pode usar qualidade um pouco menor
          if (quality > 80) quality = 80;
        } else {
          outputFormat = 'jpeg';
        }
      }
      
      // Generate cache key for this resource
      const cacheKey = `${path}-${width || 'orig'}-${height || 'orig'}-${outputFormat}-${quality}`;
      const etag = `"${Buffer.from(cacheKey).toString('base64')}"`;
      
      // Check if the browser already has this version cached
      if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return;
      }
      
      // Fetch the image from Airtable
      // Construct the Airtable URL
      // First, check if the path is a complete URL (starts with https://)
      let airtableUrl = path.startsWith('https://') 
        ? path  // Use the full URL as provided
        : `https://v5.airtableusercontent.com${path}`; // Add the base domain
      
      console.log(`Fetching Airtable image from: ${airtableUrl}`);
      
      const response = await axios.get(airtableUrl, {
        responseType: 'arraybuffer',
        headers: {
          'Accept': 'image/*',
          'Cache-Control': 'no-cache'
        }
      });
      
      // Set default content type
      const originalContentType = response.headers['content-type'] as string;
      res.set('Content-Type', originalContentType);
      
      // If this is a priority image, set higher priority headers
      if (isPriority) {
        res.set('Priority', 'high');
        res.set('Importance', 'high');
      }
      
      // If resizing or format conversion is requested, use Sharp
      if ((width || height) || outputFormat !== 'original') {
        let imageProcessor = sharp(response.data);
        
        // Get image metadata to make intelligent resizing decisions
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
          // Only width specified, calculate height to maintain aspect ratio
          resizeOptions.width = width;
          if (origWidth > 0 && origHeight > 0) {
            resizeOptions.height = Math.round((width * origHeight) / origWidth);
          }
        } else if (height) {
          // Only height specified, calculate width to maintain aspect ratio
          resizeOptions.height = height;
          if (origWidth > 0 && origHeight > 0) {
            resizeOptions.width = Math.round((height * origWidth) / origHeight);
          }
        }
        
        // Apply resize operation
        imageProcessor = imageProcessor.resize(resizeOptions);
        
        // Convert to the requested format with appropriate options
        switch(outputFormat) {
          case 'webp':
            imageProcessor = imageProcessor.webp({ 
              quality, 
              effort: 6,  // Higher compression effort
              smartSubsample: true  // Improve visual quality
            });
            res.set('Content-Type', 'image/webp');
            break;
          case 'avif':
            imageProcessor = imageProcessor.avif({ 
              quality, 
              effort: 7,  // Balanced between speed and compression
              chromaSubsampling: '4:2:0'  // Better compression
            });
            res.set('Content-Type', 'image/avif');
            break;
          case 'jpeg':
          case 'jpg':
            imageProcessor = imageProcessor.jpeg({ 
              quality,
              progressive: true,  // Progressive rendering
              optimizeScans: true,  // Optimization for smaller file size
              mozjpeg: true  // Use mozjpeg optimization
            });
            res.set('Content-Type', 'image/jpeg');
            break;
          case 'png':
            imageProcessor = imageProcessor.png({ 
              quality,
              compressionLevel: 9,  // Maximum compression
              palette: true  // Use palette to reduce colors when appropriate
            });
            res.set('Content-Type', 'image/png');
            break;
          default:
            // Keep original format
            res.set('Content-Type', originalContentType);
        }
        
        // Process and send the optimized image
        const optimizedImageBuffer = await imageProcessor.toBuffer();
        
        // Set comprehensive caching headers
        res.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
        res.set('ETag', etag);
        res.set('Vary', 'Accept'); // Vary response based on Accept header
        
        res.send(optimizedImageBuffer);
      } else {
        // No optimization requested, just pass through the original image
        res.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
        res.set('ETag', etag);
        res.set('Vary', 'Accept');
        res.send(response.data);
      }
    } catch (error) {
      // Extract more detailed information about the error
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
      
      // Send a 1x1 pixel transparent fallback image instead of text
      const fallbackImage = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-store');
      res.status(500).send(fallbackImage);
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
    } catch (error) {
      console.error("Failed to perform initial Airtable sync:", error);
    }
  }

  // Get all apps
  app.get("/api/apps", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const platform = req.query.platform as string | undefined;
      const search = req.query.search as string | undefined;

      const apps = await storage.getApps({ type, platform, search });
      res.json(apps);
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

  const httpServer = createServer(app);
  return httpServer;
}