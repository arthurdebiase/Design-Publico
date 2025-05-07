import MailerLite from 'mailerlite';

let mailerLiteClient: any = null;

// Initialize MailerLite client if API key is available
export function initMailerLite() {
  const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
  
  if (MAILERLITE_API_KEY) {
    try {
      mailerLiteClient = new MailerLite(MAILERLITE_API_KEY);
      console.log("MailerLite initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize MailerLite client:", error);
      return false;
    }
  } else {
    console.warn("MAILERLITE_API_KEY not provided. Email functionality will be disabled.");
    return false;
  }
}

/**
 * Add a subscriber to a MailerLite group
 * @param email Subscriber's email address
 * @param name Subscriber's name (optional)
 * @param language Subscriber's preferred language (optional)
 * @returns True if subscription was successful, false otherwise
 */
export async function addSubscriber(email: string, name?: string, language = 'pt'): Promise<boolean> {
  if (!mailerLiteClient) {
    console.warn("MailerLite not initialized. Cannot add subscriber.");
    return false;
  }
  
  try {
    const subscriberData = {
      email: email,
      name: name || email.split('@')[0], // Default to the part before @ if no name is provided
      fields: {
        language: language
      },
      status: 'active' // Set status as active to automatically confirm the subscription
    };
    
    // Add subscriber using the Subscribers namespace
    if (mailerLiteClient.Subscribers && typeof mailerLiteClient.Subscribers.create === 'function') {
      await mailerLiteClient.Subscribers.create(subscriberData);
      console.log(`Subscriber added to MailerLite: ${email}`);
      return true;
    } else {
      console.warn("MailerLite API does not have Subscribers.create method");
      return false;
    }
  } catch (error) {
    console.error('MailerLite subscription error:', error);
    return false;
  }
}

/**
 * Check if a subscriber exists in MailerLite
 * @param email Subscriber's email address
 * @returns True if subscriber exists, false otherwise or if there's an error
 */
export async function checkSubscriber(email: string): Promise<boolean> {
  if (!mailerLiteClient) {
    console.warn("MailerLite not initialized. Cannot check subscriber.");
    return false;
  }
  
  try {
    // Check subscriber using the Subscribers namespace
    if (mailerLiteClient.Subscribers && typeof mailerLiteClient.Subscribers.find === 'function') {
      const response = await mailerLiteClient.Subscribers.find(email);
      return !!response && !!response.id;
    } else {
      console.warn("MailerLite API does not have Subscribers.find method");
      return false;
    }
  } catch (error) {
    // If the error is that the subscriber doesn't exist, return false
    // Otherwise, log the error but still return false
    if (error instanceof Error && error.message.includes('not found')) {
      return false;
    }
    console.error('MailerLite check subscriber error:', error);
    return false;
  }
}

/**
 * Get subscriber count from MailerLite
 * @returns Number of subscribers or null if there's an error
 */
export async function getSubscriberCount(): Promise<number | null> {
  if (!mailerLiteClient) {
    console.warn("MailerLite not initialized. Cannot get subscriber count.");
    return null;
  }
  
  try {
    // Get subscribers count using the Subscribers namespace
    if (mailerLiteClient.Subscribers && typeof mailerLiteClient.Subscribers.count === 'function') {
      const count = await mailerLiteClient.Subscribers.count();
      return count || 0;
    } else if (mailerLiteClient.Subscribers && typeof mailerLiteClient.Subscribers.getAll === 'function') {
      // Fallback: try to get all subscribers with a limit and extract count
      const response = await mailerLiteClient.Subscribers.getAll({ limit: 1 });
      
      if (response && typeof response === 'object' && response.meta && typeof response.meta === 'object' && 'total' in response.meta) {
        return response.meta.total || 0;
      }
      
      return 0;
    } else {
      console.warn("MailerLite API does not have required Subscribers methods");
      return 0;
    }
  } catch (error) {
    console.error('MailerLite get subscriber count error:', error);
    return null;
  }
}