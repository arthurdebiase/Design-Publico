declare module 'mailerlite' {
  interface SubscriberFields {
    [key: string]: any;
  }

  interface Subscriber {
    email: string;
    fields?: SubscriberFields;
    groups?: Array<number | string>;
    status?: string;
    [key: string]: any;
  }

  interface MailerLiteResponse {
    id?: string | number;
    [key: string]: any;
  }

  interface SubscribersAPI {
    // Add a subscriber to a list
    addSubscriber(list_id: string | number, email: string, name: string, fields?: any, resubscribe?: boolean): Promise<MailerLiteResponse>;
    
    // Add many subscribers to a list
    addManySubscribers(list_id: string | number, subscribers: any[], resubscribe?: boolean): Promise<MailerLiteResponse>;
    
    // Get subscriber details
    getDetails(email: string, history?: boolean): Promise<MailerLiteResponse>;
    
    // Remove subscriber from a list
    deleteSubscriber(list_id: string | number, email: string): Promise<MailerLiteResponse>;
    
    // Unsubscribe a subscriber
    unsubscribeSubscriber(email: string): Promise<MailerLiteResponse>;
  }
  
  interface ListsAPI {
    // Get all lists
    getAll(limit?: number, page?: number): Promise<MailerLiteResponse[]>;
    
    // Get list details
    getDetails(id: string | number): Promise<MailerLiteResponse>;
    
    // Create new list
    addList(name: string): Promise<MailerLiteResponse>;
    
    // Update list
    updateList(id: string | number, name: string): Promise<MailerLiteResponse>;
    
    // Remove list
    removeList(id: string | number): Promise<MailerLiteResponse>;
    
    // Get active subscribers in a list
    getActiveSubscribers(id: string | number, limit?: number, page?: number): Promise<MailerLiteResponse[]>;
    
    // Get unsubscribed subscribers in a list
    getUnsubscribedSubscribers(id: string | number, limit?: number, page?: number): Promise<MailerLiteResponse[]>;
    
    // Get bounced subscribers in a list
    getBouncedSubscribers(id: string | number, limit?: number, page?: number): Promise<MailerLiteResponse[]>;
  }
  
  interface CampaignsAPI {
    // Get all campaigns
    getAll(limit?: number, page?: number): Promise<MailerLiteResponse[]>;
    
    // Get campaign details
    getDetails(id: string | number): Promise<MailerLiteResponse>;
    
    // Get campaign recipients
    getRecipients(id: string | number, limit?: number, page?: number): Promise<MailerLiteResponse[]>;
    
    // Get campaign opens
    getOpens(id: string | number, limit?: number, page?: number): Promise<MailerLiteResponse[]>;
    
    // Get campaign clicks
    getClicks(id: string | number, limit?: number, page?: number): Promise<MailerLiteResponse[]>;
    
    // Get campaign unsubscribes
    getUnsubscribes(id: string | number, limit?: number, page?: number): Promise<MailerLiteResponse[]>;
    
    // Get campaign spam complaints
    getSpamComplaints(id: string | number, limit?: number, page?: number): Promise<MailerLiteResponse[]>;
  }
  
  class MailerLite {
    constructor(apiKey: string);
    
    // API modules
    Subscribers: SubscribersAPI;
    Lists: ListsAPI;
    Campaigns: CampaignsAPI;
  }

  export = MailerLite;
}