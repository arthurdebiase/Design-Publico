import { Request, Response } from "express";
import { z } from "zod";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file and directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Schema for validating newsletter subscription requests
const subscribeSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  language: z.string().optional(),
  name: z.string().optional(),
});

// Simple JSON file to store subscribers when MailerLite API is not available
// This is a temporary solution until the MailerLite API is properly integrated
const SUBSCRIBERS_FILE = path.join(__dirname, '../subscribers.json');

interface Subscriber {
  email: string;
  name?: string;
  language?: string;
  subscriptionDate: string;
}

// Function to read subscribers from file
function readSubscribers(): Subscriber[] {
  try {
    if (!fs.existsSync(SUBSCRIBERS_FILE)) {
      // Create an empty file if it doesn't exist
      fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading subscribers file:', error);
    return [];
  }
}

// Function to write subscribers to file
function writeSubscribers(subscribers: Subscriber[]): boolean {
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing subscribers file:', error);
    return false;
  }
}

// Function to add a subscriber
function addSubscriber(email: string, name?: string, language?: string): boolean {
  try {
    const subscribers = readSubscribers();
    
    // Check if email already exists
    if (subscribers.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      // Already subscribed
      return false;
    }
    
    // Add new subscriber
    subscribers.push({
      email,
      name,
      language,
      subscriptionDate: new Date().toISOString()
    });
    
    return writeSubscribers(subscribers);
  } catch (error) {
    console.error('Error adding subscriber:', error);
    return false;
  }
}

// Function to check if subscriber exists
function checkSubscriber(email: string): boolean {
  try {
    const subscribers = readSubscribers();
    return subscribers.some(s => s.email.toLowerCase() === email.toLowerCase());
  } catch (error) {
    console.error('Error checking subscriber:', error);
    return false;
  }
}

// Function to get subscriber count
function getSubscriberCount(): number {
  try {
    const subscribers = readSubscribers();
    return subscribers.length;
  } catch (error) {
    console.error('Error getting subscriber count:', error);
    return 0;
  }
}

/**
 * Subscribe to the newsletter
 * This function uses a file-based storage as a fallback until MailerLite API is working
 */
export async function subscribeToNewsletter(req: Request, res: Response) {
  try {
    // Validate the request body
    const validation = subscribeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid request data", 
        errors: validation.error.errors 
      });
    }

    // Default to Portuguese (pt) as our application primarily targets Brazilian users
    const { email, language = "pt", name } = validation.data;
    
    // Check if the subscriber already exists
    if (checkSubscriber(email)) {
      return res.status(200).json({ 
        message: "Already subscribed", 
        alreadySubscribed: true 
      });
    }
    
    // Log the subscription for development purposes
    console.log(`New newsletter subscription: ${email} (language: ${language})`);
    
    // Add the subscriber
    const addResult = addSubscriber(email, name, language);
    
    if (addResult) {
      console.log(`Subscriber added: ${email}`);
    } else {
      console.log(`Failed to add subscriber: ${email} (may already exist)`);
      return res.status(200).json({ 
        message: "Already subscribed", 
        alreadySubscribed: true 
      });
    }
    
    // Get the updated subscriber count
    const subscriberCount = getSubscriberCount();
    
    return res.status(201).json({ 
      message: "Successfully subscribed to the newsletter",
      subscriberCount: subscriberCount
    });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return res.status(500).json({ message: "Failed to subscribe to newsletter" });
  }
}

/**
 * Get all newsletter subscribers (for admin purposes)
 * This would typically be protected by authentication
 */
export async function getNewsletterSubscribers(_req: Request, res: Response) {
  try {
    // Get subscriber count
    const count = getSubscriberCount();
    
    // Return the count
    return res.status(200).json({ count });
  } catch (error) {
    console.error("Error getting newsletter subscribers:", error);
    return res.status(500).json({ message: "Failed to get newsletter subscribers" });
  }
}