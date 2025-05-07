
import { Request, Response } from "express";
import { z } from "zod";
import MailerLite from 'mailerlite';

// Schema for validating newsletter subscription requests
const subscribeSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  language: z.string().optional(),
  name: z.string().optional(),
});

let mailerLiteClient: any = null;
let isMailerLiteDisabled = false;

// Initialize MailerLite client
const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
if (MAILERLITE_API_KEY) {
  mailerLiteClient = new MailerLite(MAILERLITE_API_KEY);
  console.log("MailerLite initialized successfully");
} else {
  console.warn("MAILERLITE_API_KEY not provided. Email functionality will be disabled.");
  isMailerLiteDisabled = true;
}

/**
 * Subscribe to the newsletter using MailerLite
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

    if (!mailerLiteClient || isMailerLiteDisabled) {
      return res.status(503).json({ 
        message: "Newsletter service is currently unavailable" 
      });
    }

    const { email, language = "pt", name } = validation.data;
    
    try {
      // Check if subscriber already exists
      const subscriber = await mailerLiteClient.Subscribers.getDetails(email);
      if (subscriber) {
        return res.status(200).json({ 
          message: "Already subscribed", 
          alreadySubscribed: true 
        });
      }
    } catch (error) {
      // Subscriber not found, continue with subscription
    }

    // Add subscriber to MailerLite
    await mailerLiteClient.Subscribers.addSubscriber(
      '1', // Default group ID
      email,
      name || email.split('@')[0],
      { language },
      true // Resubscribe if unsubscribed
    );
    
    return res.status(201).json({ 
      message: "Successfully subscribed to the newsletter"
    });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return res.status(500).json({ message: "Failed to subscribe to newsletter" });
  }
}

/**
 * Get subscriber count from MailerLite
 */
export async function getNewsletterSubscribers(_req: Request, res: Response) {
  try {
    if (!mailerLiteClient || isMailerLiteDisabled) {
      return res.status(503).json({ 
        message: "Newsletter service is currently unavailable",
        count: 0
      });
    }

    // Get first group details which includes subscriber count
    const groups = await mailerLiteClient.Lists.getAll(1, 1);
    if (Array.isArray(groups) && groups.length > 0) {
      const groupDetails = await mailerLiteClient.Lists.getDetails(groups[0].id);
      return res.status(200).json({ 
        count: groupDetails.active || 0
      });
    }

    return res.status(200).json({ count: 0 });
  } catch (error) {
    console.error("Error getting newsletter subscribers:", error);
    return res.status(500).json({ message: "Failed to get newsletter subscribers" });
  }
}
