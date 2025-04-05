import MailerLite from 'mailerlite';

let mailerLiteClient: MailerLite | null = null;

// Initialize MailerLite client if API key is available
export function initMailerLite() {
  const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
  
  if (MAILERLITE_API_KEY) {
    mailerLiteClient = new MailerLite({
      api_key: MAILERLITE_API_KEY
    });
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
export async function addSubscriber(email: string, name?: string, language = 'en'): Promise<boolean> {
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
      }
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