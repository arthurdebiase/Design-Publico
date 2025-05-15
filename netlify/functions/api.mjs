import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';

let handler;

// Function to set up Express app with routes
function setupApp(registerRoutes) {
  const app = express();

  // Enable CORS
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Use JSON middleware
  app.use(express.json());

  // Create a new server instance using registerRoutes
  // but don't start it listening (Netlify will handle that)
  registerRoutes(app)
    .then(() => {
      console.log("Routes registered successfully");
    })
    .catch(error => {
      console.error("Error registering routes:", error);
    });

  // Create and store the serverless handler
  handler = serverless(app);
}

// Use dynamic import for server modules to handle ESM/CommonJS differences
import('../../server/routes.js').then(module => {
  const { registerRoutes } = module;
  setupApp(registerRoutes);
}).catch(err => {
  console.error('Error importing routes:', err);
});

// Export the serverless handler function
export async function handler(event, context) {
  // If the handler isn't ready yet, return an error
  if (!handler) {
    return {
      statusCode: 503,
      body: JSON.stringify({ message: 'Server is initializing, please try again shortly' })
    };
  }
  
  // Otherwise, use the initialized handler
  return handler(event, context);
}