import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppSchema, insertScreenSchema } from "@shared/schema";
import { z } from "zod";
import { subscribeToNewsletter, getNewsletterSubscribers } from "./newsletter";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Airtable API key
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "";
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "app5Z2hf5ARjgunjy"; // Default to known base ID if not provided
  
  if (!AIRTABLE_API_KEY) {
    console.warn("Airtable API key not provided. Using mock data.");
  } else if (!AIRTABLE_BASE_ID) {
    console.warn("Airtable base ID not provided. Using default base ID.");
  } else {
    console.log("Airtable credentials detected. Attempting to sync data...");
    try {
      await storage.syncFromAirtable(AIRTABLE_API_KEY, AIRTABLE_BASE_ID);
      console.log("Initial Airtable sync completed successfully.");
    } catch (error) {
      console.error("Failed to perform initial Airtable sync. Error details:", error);
      console.log("The application will continue with mock data. You can manually trigger a sync later.");
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

  // Sync data from Airtable
  app.post("/api/sync", async (req, res) => {
    try {
      // Check for API key
      if (!AIRTABLE_API_KEY) {
        return res.status(400).json({ 
          message: "Airtable API key not configured",
          help: "Please set the AIRTABLE_API_KEY environment variable or secret"
        });
      }
      
      // Use either provided base ID or default
      const baseId = AIRTABLE_BASE_ID || req.body.baseId || "app5Z2hf5ARjgunjy";
      console.log(`Starting Airtable sync with base ID: ${baseId}`);
      
      await storage.syncFromAirtable(AIRTABLE_API_KEY, baseId);
      res.json({ 
        message: "Sync completed successfully", 
        baseId,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error syncing from Airtable:", error);
      
      // Send more detailed error for debugging
      res.status(500).json({ 
        message: "Failed to sync from Airtable", 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
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
