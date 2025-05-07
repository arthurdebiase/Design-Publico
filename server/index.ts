import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";
import { initMailerLite } from "./mailerlite";
import path from "path";
import fs from "fs";

// Load environment variables from .env file
dotenv.config();

// Initialize MailerLite if API key is available
initMailerLite();

// Configure environment variables
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error with stack trace
    console.error(`Error [${status}]: ${message}`);
    console.error(err.stack);

    // Send a more detailed error response in development
    if (!isProduction) {
      res.status(status).json({
        message,
        stack: err.stack,
        details: err
      });
    } else {
      // Only show message in production for security
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Setup Vite in development mode
    await setupVite(app, server);
  } else {
    // Add proper CORS headers for production
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      next();
    });
    
    // Add cache control for static assets
    app.use((req, res, next) => {
      if (req.url.match(/\.(css|js|jpg|png|svg|ico|webp)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      }
      next();
    });
    
    // Try different paths for static files to improve deployment compatibility
    const possiblePaths = [
      path.join(__dirname, '../dist/public'),
      path.join(__dirname, 'public'),
      path.join(__dirname, '../client/dist'),
      path.join(process.cwd(), 'dist/public'),
      path.join(process.cwd(), 'client/dist')
    ];
    
    // Try each path and use the first one that exists
    for (const staticPath of possiblePaths) {
      if (fs.existsSync(staticPath)) {
        console.log(`Serving static files from: ${staticPath}`);
        app.use(express.static(staticPath, { maxAge: '1d' }));
      }
    }
    
    // Also use the standard serveStatic function as a fallback
    serveStatic(app);
    
    // Add a catch-all route to serve index.html for client-side routing
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      // Try to find the index.html in multiple possible locations
      for (const staticPath of possiblePaths) {
        const indexPath = path.join(staticPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          return res.sendFile(indexPath);
        }
      }
      
      // If no index.html is found, continue to the next middleware
      next();
    });
  }

  // Serve the app on configured port (defaults to 5000)
  // this serves both the API and the client.
  server.listen({
    port: parseInt(port.toString(), 10),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server running in ${isProduction ? 'production' : 'development'} mode on port ${port}`);
  });
})();