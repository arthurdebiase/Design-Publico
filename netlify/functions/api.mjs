import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import { registerRoutes } from '../../server/routes.js';

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

// Export the serverless handler
export const handler = serverless(app);