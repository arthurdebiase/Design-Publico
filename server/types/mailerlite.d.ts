declare module 'mailerlite' {
  interface MailerLiteOptions {
    api_key: string;
  }

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

  class MailerLite {
    constructor(options: MailerLiteOptions);
    
    // Subscribers
    getSubscribers(params?: object): Promise<MailerLiteResponse[]>;
    getSubscriber(email: string): Promise<MailerLiteResponse>;
    addSubscriber(data: Subscriber): Promise<MailerLiteResponse>;
    updateSubscriber(email: string, data: Partial<Subscriber>): Promise<MailerLiteResponse>;
    removeSubscriber(email: string): Promise<boolean>;
    
    // Groups
    getGroups(params?: object): Promise<MailerLiteResponse[]>;
    getGroup(id: string | number): Promise<MailerLiteResponse>;
    createGroup(name: string): Promise<MailerLiteResponse>;
    updateGroup(id: string | number, name: string): Promise<MailerLiteResponse>;
    deleteGroup(id: string | number): Promise<boolean>;
    
    // Group subscribers
    getGroupSubscribers(groupId: string | number, params?: object): Promise<MailerLiteResponse[]>;
    addSubscriberToGroup(groupId: string | number, data: Subscriber): Promise<MailerLiteResponse>;
    removeSubscriberFromGroup(groupId: string | number, email: string): Promise<boolean>;
    
    // Campaigns
    getCampaigns(params?: object): Promise<MailerLiteResponse[]>;
    getCampaign(id: string | number): Promise<MailerLiteResponse>;
  }

  export = MailerLite;
}