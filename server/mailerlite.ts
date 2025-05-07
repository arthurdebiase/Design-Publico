import MailerLite from 'mailerlite';

let mailerLiteClient: any = null;
let defaultListId: string = '1'; // Default to first list, change this to your actual default list ID

// Initialize MailerLite client if API key is available
export function initMailerLite() {
  const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
  
  if (MAILERLITE_API_KEY) {
    mailerLiteClient = new MailerLite(MAILERLITE_API_KEY);
    console.log("MailerLite initialized successfully");
    return true;
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
    const subscriber = {
      email: email,
      fields: {
        name: name || email.split('@')[0], // Default to the part before @ if no name is provided
        language: language
      },
      // Set status as active to automatically confirm the subscription
      status: 'active'
    };
    
    // Add subscriber to default group
    await mailerLiteClient.addSubscriber(subscriber);
    console.log(`Subscriber added to MailerLite: ${email}`);
    return true;
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
    const response = await mailerLiteClient.getSubscriber(email);
    return !!response && !!response.id;
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
    const response = await mailerLiteClient.getSubscribers({ limit: 1 });
    // The response might include metadata with total count
    // This is implementation-specific, so we need to check the structure
    if (response && typeof response === 'object' && 'meta' in response && response.meta && typeof response.meta === 'object' && 'total' in response.meta) {
      return (response.meta as any).total || 0;
    }
    
    // Fallback: If we can't get the count from metadata, return the length of the results array
    if (Array.isArray(response)) {
      // Not ideal for large subscriber counts, but works as a fallback
      return response.length;
    }
    
    return 0;
  } catch (error) {
    console.error('MailerLite get subscriber count error:', error);
    return null;
  }
}