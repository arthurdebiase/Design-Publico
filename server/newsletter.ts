import { Request, Response } from "express";
import { z } from "zod";

// Schema for validating newsletter subscription requests
const subscribeSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  language: z.string().optional(),
  name: z.string().optional(),
});

// A simple in-memory storage for demo purposes
// In a real application, this would be stored in a database
const subscribers = new Set<string>();

/**
 * Subscribe to the newsletter
 * MailerLite integration is temporarily disabled, using in-memory storage only
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
    
    // Check if the email is already subscribed in our local cache
    if (subscribers.has(email)) {
      return res.status(200).json({ 
        message: "Already subscribed", 
        alreadySubscribed: true 
      });
    }
    
    // Add to our in-memory set
    subscribers.add(email);
    
    // Log the subscription for development purposes
    console.log(`New newsletter subscription: ${email} (language: ${language})`);
    
    return res.status(201).json({ 
      message: "Successfully subscribed to the newsletter",
      subscriberCount: subscribers.size
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
    // Just return the count from the in-memory set
    return res.status(200).json({ 
      count: subscribers.size
    });
  } catch (error) {
    console.error("Error getting newsletter subscribers:", error);
    return res.status(500).json({ message: "Failed to get newsletter subscribers" });
  }
}