import { Request, Response } from "express";
import { z } from "zod";
import { addSubscriber, checkSubscriber, getSubscriberCount } from "./mailerlite";

// Schema for validating newsletter subscription requests
const subscribeSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  language: z.string().optional(),
  name: z.string().optional(),
});

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
    
    // Check with MailerLite if the subscriber already exists
    const subscriberExists = await checkSubscriber(email);
    if (subscriberExists) {
      return res.status(200).json({ 
        message: "Already subscribed", 
        alreadySubscribed: true 
      });
    }
    
    // Log the subscription for development purposes
    console.log(`New newsletter subscription: ${email} (language: ${language})`);
    
    // Add the subscriber to MailerLite
    const addResult = await addSubscriber(email, name, language);
    
    if (addResult) {
      console.log(`Subscriber added to MailerLite: ${email}`);
    } else {
      console.log(`Failed to add subscriber to MailerLite: ${email} (MailerLite not configured or error occurred)`);
      return res.status(500).json({ message: "Failed to subscribe to newsletter" });
    }
    
    // Get the updated subscriber count from MailerLite
    const subscriberCount = await getSubscriberCount() || 0;
    
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
    // Get subscriber count from MailerLite
    const mailerLiteCount = await getSubscriberCount();
    
    // Return the count (0 if not available)
    return res.status(200).json({
      count: mailerLiteCount || 0
    });
  } catch (error) {
    console.error("Error getting newsletter subscribers:", error);
    return res.status(500).json({ message: "Failed to get newsletter subscribers" });
  }
}