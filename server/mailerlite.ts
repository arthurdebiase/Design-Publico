import axios, { AxiosInstance, AxiosError } from 'axios';

let mailerLiteClient: AxiosInstance | null = null;
const API_BASE_URL = 'https://connect.mailerlite.com/api';

// Initialize MailerLite client if API key is available
export function initMailerLite() {
  const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
  
  if (MAILERLITE_API_KEY) {
    try {
      mailerLiteClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${MAILERLITE_API_KEY}`
        }
      });
      console.log("MailerLite API client initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize MailerLite API client:", error);
      return false;
    }
  } else {
    console.warn("MAILERLITE_API_KEY not provided. Email functionality will be disabled.");
    return false;
  }
}

/**
 * Add a subscriber to MailerLite
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
      fields: {
        name: name || email.split('@')[0], // Default to the part before @ if no name is provided
        language: language
      },
      status: 'active' // Set status as active to automatically confirm the subscription
    };
    
    // Add subscriber using the direct API
    const response = await mailerLiteClient.post('/subscribers', subscriberData);
    
    if (response.status >= 200 && response.status < 300) {
      console.log(`Subscriber added to MailerLite: ${email}`);
      return true;
    } else {
      console.warn(`Failed to add subscriber to MailerLite: ${email}. Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    // Check if the error is because the subscriber already exists
    const axiosError = error as AxiosError;
    if (axiosError.response && axiosError.response.status === 409) {
      // Subscriber already exists, but we don't want to tell the user for privacy reasons
      console.log(`Subscriber already exists in MailerLite: ${email}`);
      return true; // Return true to indicate "success" (silently)
    }
    
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
    // URL encode the email address
    const encodedEmail = encodeURIComponent(email);
    
    // Check subscriber by searching for the email
    const response = await mailerLiteClient.get(`/subscribers/${encodedEmail}`);
    
    return response.status === 200;
  } catch (error) {
    const axiosError = error as AxiosError;
    // If the error is 404, the subscriber doesn't exist
    if (axiosError.response && axiosError.response.status === 404) {
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
    // Get subscriber count using the stats endpoint if available
    const response = await mailerLiteClient.get('/subscribers', {
      params: {
        limit: 1 // We only need the count, not the actual subscribers
      }
    });
    
    if (response.data && response.data.meta && 'total' in response.data.meta) {
      return response.data.meta.total || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('MailerLite get subscriber count error:', error);
    return null;
  }
}