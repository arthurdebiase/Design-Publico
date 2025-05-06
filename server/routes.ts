import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppSchema, insertScreenSchema } from "@shared/schema";
import { z } from "zod";
import { subscribeToNewsletter, getNewsletterSubscribers } from "./newsletter";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  
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

  // Get app by ID
  app.get("/api/apps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid app ID" });
      }
      
      const app = await storage.getAppById(id);
      if (!app) {
        return res.status(404).json({ message: "App not found" });
      }
      
      res.json(app);
    } catch (error) {
      console.error("Error fetching app:", error);
      res.status(500).json({ message: "Failed to fetch app" });
    }
  });

  // Get screens for an app
  app.get("/api/apps/:id/screens", async (req, res) => {
    try {
      const appId = parseInt(req.params.id);
      if (isNaN(appId)) {
        return res.status(400).json({ message: "Invalid app ID" });
      }
      
      const screens = await storage.getScreensByAppId(appId);
      res.json(screens);
    } catch (error) {
      console.error("Error fetching screens:", error);
      res.status(500).json({ message: "Failed to fetch screens" });
    }
  });

  // Public Sync endpoint (removed as it's duplicated below with the protected version)

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
  
  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Protected routes example
  app.post('/api/sync', isAuthenticated, async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
