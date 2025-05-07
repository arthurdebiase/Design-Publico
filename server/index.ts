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
    
    // Add extra error logging for production troubleshooting
    app.use((req, res, next) => {
      const originalEnd = res.end;
      res.end = function(chunk, encoding) {
        if (res.statusCode >= 400) {
          console.error(`[ERROR] ${req.method} ${req.originalUrl} - Status ${res.statusCode}`);
        }
        return originalEnd.call(this, chunk, encoding);
      };
      next();
    });
    
    // Handle symbol.png specifically since it's showing 502 errors
    app.get('/src/assets/symbol.png', (req, res) => {
      // Provide a fallback path to the symbol from any available location
      const symboPath = path.join(process.cwd(), 'designpublico-symbol.png');
      if (fs.existsSync(symboPath)) {
        return res.sendFile(symboPath);
      }
      // If not found, return a 404 instead of 502
      res.status(404).send('Symbol image not found');
    });
    
    // Add better cache control for static assets
    app.use((req, res, next) => {
      // Set appropriate cache headers based on file type
      if (req.url.match(/\.(css|js)$/)) {
        // Short cache for code files (1 hour) to ensure updates are reflected
        res.setHeader('Cache-Control', 'public, max-age=3600');
      } else if (req.url.match(/\.(jpg|png|svg|ico|webp|gif|woff|woff2|ttf|eot)$/)) {
        // Longer cache for static assets (1 week)
        res.setHeader('Cache-Control', 'public, max-age=604800');
      }
      next();
    });
    
    // Define static paths with clear priority
    const staticPaths = [
      // First priority - standard dist folder
      { path: path.join(process.cwd(), 'dist/public'), maxAge: '1d' },
      // Second priority - public folder
      { path: path.join(process.cwd(), 'public'), maxAge: '1d' },
      // Third priority - attached assets
      { path: path.join(process.cwd(), 'attached_assets'), maxAge: '7d' },
      // Fourth priority - client dist
      { path: path.join(process.cwd(), 'client/dist'), maxAge: '1d' },
      // Fifth priority - relative paths from current directory
      { path: path.join(__dirname, '../dist/public'), maxAge: '1d' },
      { path: path.join(__dirname, 'public'), maxAge: '1d' },
      { path: path.join(__dirname, '../client/dist'), maxAge: '1d' }
    ];
    
    // Serve static files from all available paths
    let staticPathsFound = 0;
    for (const { path: staticPath, maxAge } of staticPaths) {
      if (fs.existsSync(staticPath)) {
        console.log(`Serving static files from: ${staticPath}`);
        app.use(express.static(staticPath, { 
          maxAge, 
          etag: true,
          lastModified: true,
          setHeaders: (res, filePath) => {
            if (filePath.endsWith('.html')) {
              // Don't cache HTML
              res.setHeader('Cache-Control', 'no-cache');
            }
          }
        }));
        staticPathsFound++;
      }
    }
    
    console.log(`Found ${staticPathsFound} valid static file directories`);
    
    // Also use the standard serveStatic function as a fallback
    console.log("Using serveStatic as a fallback");
    serveStatic(app);
    
    // Add a catch-all route to serve index.html for client-side routing
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        console.log(`API route not found: ${req.path}`);
        return res.status(404).json({ message: "API endpoint not found" });
      }
      
      console.log(`Trying to serve SPA route: ${req.path}`);
      
      // Try to find the index.html in multiple possible locations
      let indexFound = false;
      for (const { path: staticPath } of staticPaths) {
        const indexPath = path.join(staticPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          console.log(`Serving index.html from: ${indexPath}`);
          indexFound = true;
          return res.sendFile(indexPath);
        }
      }
      
      if (!indexFound) {
        console.log("No index.html found in any static path");
        // If no index.html is found, serve a basic HTML
        res.type('html').send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DESIGN PÚBLICO</title>
            <style>
              body { font-family: system-ui, sans-serif; display: flex; align-items: center; 
                justify-content: center; height: 100vh; margin: 0; flex-direction: column; }
              h1 { margin-bottom: 10px; }
              p { margin-top: 0; color: #666; }
            </style>
          </head>
          <body>
            <h1>DESIGN PÚBLICO</h1>
            <p>Loading application...</p>
            <script>window.location.href = "/";</script>
          </body>
          </html>
        `);
      }
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