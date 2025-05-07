import MailerLite from 'mailerlite';

let mailerLiteClient: any = null;
let defaultListId: string = '1'; // Default to first list, change this to your actual default list ID
let isMailerLiteDisabled = false;

// Initialize MailerLite client if API key is available
export function initMailerLite() {
  const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
  
  try {
    if (MAILERLITE_API_KEY) {
      mailerLiteClient = new MailerLite(MAILERLITE_API_KEY);
      console.log("MailerLite initialized successfully");
      return true;
    } else {
      console.warn("MAILERLITE_API_KEY not provided. Email functionality will be disabled.");
      isMailerLiteDisabled = true;
      return false;
    }
  } catch (error) {
    console.error("Error initializing MailerLite:", error);
    isMailerLiteDisabled = true;
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
  if (!mailerLiteClient || isMailerLiteDisabled) {
    console.warn("MailerLite not initialized or disabled. Cannot add subscriber to MailerLite.");
    return false;
  }
  
  try {
    // Format the name or use the part before @ if no name is provided
    const formattedName = name || email.split('@')[0];
    
    // Create fields object with language
    const fields = {
      language: language
    };
    
    // Add subscriber to the default list
    // Note: MailerLite SDK v0.4.0 requires list_id as first parameter
    const response = await mailerLiteClient.Subscribers.addSubscriber(
      defaultListId,   // list_id 
      email,           // email
      formattedName,   // name
      fields,          // custom fields
      true             // resubscribe if they were previously unsubscribed
    );
    
    console.log(`Subscriber added to MailerLite: ${email}`);
    return true;
  } catch (error) {
    console.error('MailerLite subscription error:', error);
    // If we get an error, disable MailerLite for the rest of this session
    isMailerLiteDisabled = true;
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
    // Using MailerLite SDK v0.4.0 - getDetails requires just email parameter
    const response = await mailerLiteClient.Subscribers.getDetails(email);
    // Check if response has data and it indicates an active subscriber
    return !!response && Array.isArray(response) && response.length > 0;
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
    // Get the first list's details - assuming we're primarily using one list
    const lists = await mailerLiteClient.Lists.getAll(1, 1); // Limit to 1 list, page 1
    
    if (Array.isArray(lists) && lists.length > 0) {
      // Use the first list or the default list
      const listId = lists[0].id || defaultListId;
      
      // Get list details which includes subscriber count
      const listDetails = await mailerLiteClient.Lists.getDetails(listId);
      
      if (listDetails && typeof listDetails === 'object' && 'active' in listDetails) {
        // Return active subscribers count
        return listDetails.active || 0;
      }
    }
    
    // Fallback approach if we can't get count from list details
    return 0;
  } catch (error) {
    console.error('MailerLite get subscriber count error:', error);
    return null;
  }
}