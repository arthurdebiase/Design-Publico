import { Request, Response } from "express";
import { z } from "zod";
import { addSubscriber, checkSubscriber, getSubscriberCount } from "./mailerlite";

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
 * This function connects to MailerLite for newsletter management
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
    
    // Also check with MailerLite if the subscriber already exists
    const subscriberExists = await checkSubscriber(email);
    if (subscriberExists) {
      // Add to our local cache if it exists in MailerLite but not in our cache
      subscribers.add(email);
      return res.status(200).json({ 
        message: "Already subscribed", 
        alreadySubscribed: true 
      });
    }

    // Add to our in-memory set
    subscribers.add(email);
    
    // Log the subscription for development purposes
    console.log(`New newsletter subscription: ${email} (language: ${language})`);
    
    // Try to add the subscriber to MailerLite
    const addResult = await addSubscriber(email, name, language);
    
    if (addResult) {
      console.log(`Subscriber added to MailerLite: ${email}`);
    } else {
      console.log(`Failed to add subscriber to MailerLite: ${email} (MailerLite not configured or error occurred)`);
    }
    
    // Get the updated subscriber count
    let count = subscribers.size;
    const mailerLiteCount = await getSubscriberCount();
    
    // If we have a count from MailerLite, use that instead
    if (mailerLiteCount !== null) {
      count = mailerLiteCount;
    }
    
    return res.status(201).json({ 
      message: "Successfully subscribed to the newsletter",
      subscriberCount: count
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
    // Try to get subscriber count from MailerLite first
    const mailerLiteCount = await getSubscriberCount();
    
    if (mailerLiteCount !== null) {
      // If we can get the count from MailerLite, use that
      return res.status(200).json({
        count: mailerLiteCount
      });
    }
    
    // Fallback to our in-memory set if MailerLite is not available
    return res.status(200).json({ 
      count: subscribers.size
    });
  } catch (error) {
    console.error("Error getting newsletter subscribers:", error);
    return res.status(500).json({ message: "Failed to get newsletter subscribers" });
  }
}