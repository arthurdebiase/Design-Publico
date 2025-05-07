import { Request, Response } from "express";
import { z } from "zod";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { addSubscriber as addMailerLiteSubscriber, checkSubscriber as checkMailerLiteSubscriber, getSubscriberCount as getMailerLiteSubscriberCount } from "./mailerlite";

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
// This is a fallback solution if the MailerLite API fails
const SUBSCRIBERS_FILE = path.join(__dirname, '../subscribers.json');

interface Subscriber {
  email: string;
  name?: string;
  language?: string;
  subscriptionDate: string;
}

// Function to read subscribers from file (used as fallback)
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

// Function to write subscribers to file (used as fallback)
function writeSubscribers(subscribers: Subscriber[]): boolean {
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing subscribers file:', error);
    return false;
  }
}

// Function to add a subscriber to the local file (used as fallback)
function addFileSubscriber(email: string, name?: string, language?: string): boolean {
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
    console.error('Error adding subscriber to file:', error);
    return false;
  }
}

// Function to check if subscriber exists in local file (used as fallback)
function checkFileSubscriber(email: string): boolean {
  try {
    const subscribers = readSubscribers();
    return subscribers.some(s => s.email.toLowerCase() === email.toLowerCase());
  } catch (error) {
    console.error('Error checking subscriber in file:', error);
    return false;
  }
}

// Function to get subscriber count from local file (used as fallback)
function getFileSubscriberCount(): number {
  try {
    const subscribers = readSubscribers();
    return subscribers.length;
  } catch (error) {
    console.error('Error getting subscriber count from file:', error);
    return 0;
  }
}

/**
 * Subscribe to the newsletter
 * This function first tries to use MailerLite API, with file storage as fallback
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
    
    // Log the subscription attempt for development purposes
    console.log(`New newsletter subscription: ${email} (language: ${language})`);
    
    // Try to use MailerLite API first
    let subscriptionSuccess = false;
    let subscriberCount = 0;
    
    try {
      // Add subscriber to MailerLite
      subscriptionSuccess = await addMailerLiteSubscriber(email, name, language);
      
      if (subscriptionSuccess) {
        // Try to get subscriber count from MailerLite
        const count = await getMailerLiteSubscriberCount();
        if (count !== null) {
          subscriberCount = count;
        }
      }
    } catch (error) {
      console.error('Error using MailerLite API, falling back to file storage:', error);
      // If MailerLite fails, fall back to file storage
      subscriptionSuccess = false;
    }
    
    // If MailerLite subscription failed, use file storage as fallback
    if (!subscriptionSuccess) {
      console.log(`MailerLite subscription failed, using file storage fallback for: ${email}`);
      
      // Check if already subscribed in file (but don't tell the user for security reasons)
      const alreadySubscribed = checkFileSubscriber(email);
      
      if (!alreadySubscribed) {
        // Add to file storage
        const addResult = addFileSubscriber(email, name, language);
        if (addResult) {
          console.log(`Subscriber added to file storage: ${email}`);
          subscriptionSuccess = true;
        }
      } else {
        // Treat as success even if already subscribed (for privacy)
        subscriptionSuccess = true;
      }
      
      // Get count from file storage
      subscriberCount = getFileSubscriberCount();
    }
    
    // Always return a success message, even if there was an issue
    // This prevents email enumeration for privacy/security reasons
    return res.status(201).json({ 
      message: "Thank you for subscribing to our newsletter",
      subscriberCount: subscriberCount
    });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return res.status(500).json({ message: "Failed to subscribe to newsletter" });
  }
}

/**
 * Get all newsletter subscribers count (for admin purposes)
 * This would typically be protected by authentication
 */
export async function getNewsletterSubscribers(_req: Request, res: Response) {
  try {
    // Try to get count from MailerLite first
    let count = 0;
    
    try {
      const mailerLiteCount = await getMailerLiteSubscriberCount();
      if (mailerLiteCount !== null) {
        count = mailerLiteCount;
      }
    } catch (error) {
      console.error('Error getting count from MailerLite, falling back to file storage:', error);
    }
    
    // If MailerLite count is zero or failed, try file storage
    if (count === 0) {
      count = getFileSubscriberCount();
    }
    
    // Return the count
    return res.status(200).json({ count });
  } catch (error) {
    console.error("Error getting newsletter subscribers count:", error);
    return res.status(500).json({ message: "Failed to get newsletter subscribers count" });
  }
}