import { MailService } from '@sendgrid/mail';

let mailService: MailService | null = null;

// Initialize SendGrid client if API key is available
export function initSendGrid() {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  
  if (SENDGRID_API_KEY) {
    mailService = new MailService();
    mailService.setApiKey(SENDGRID_API_KEY);
    console.log("SendGrid initialized successfully");
    return true;
  } else {
    console.warn("SENDGRID_API_KEY not provided. Email functionality will be disabled.");
    return false;
  }
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using SendGrid
 * @param params Email parameters
 * @returns True if email was sent successfully, false otherwise
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!mailService) {
    console.warn("SendGrid not initialized. Cannot send email.");
    return false;
  }
  
  try {
    await mailService.send({
      to: params.to,
      from: params.from, // Must be a verified sender in SendGrid
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    console.log(`Email sent to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Send a newsletter subscription confirmation email
 * @param email The subscriber's email address
 * @param language The subscriber's preferred language
 * @returns True if email was sent successfully, false otherwise
 */
export async function sendNewsletterConfirmation(email: string, language = 'en'): Promise<boolean> {
  if (!mailService) {
    console.warn("SendGrid not initialized. Cannot send newsletter confirmation.");
    return false;
  }
  
  const subject = language === 'pt' ? 'Confirmação de inscrição na newsletter' : 
                 language === 'es' ? 'Confirmación de suscripción al boletín' :
                 'Newsletter Subscription Confirmation';
                 
  const text = language === 'pt' ? 
    `Obrigado por se inscrever na newsletter do DesignGallery. Você receberá atualizações periódicas sobre novidades em nosso catálogo.` :
    language === 'es' ?
    `Gracias por suscribirte al boletín de DesignGallery. Recibirás actualizaciones periódicas sobre novedades en nuestro catálogo.` :
    `Thank you for subscribing to the DesignGallery newsletter. You will receive periodic updates about new additions to our catalog.`;
    
  const html = language === 'pt' ? 
    `<p>Obrigado por se inscrever na newsletter do <strong>DesignGallery</strong>.</p>
     <p>Você receberá atualizações periódicas sobre novidades em nosso catálogo.</p>` :
    language === 'es' ?
    `<p>Gracias por suscribirte al boletín de <strong>DesignGallery</strong>.</p>
     <p>Recibirás actualizaciones periódicas sobre novedades en nuestro catálogo.</p>` :
    `<p>Thank you for subscribing to the <strong>DesignGallery</strong> newsletter.</p>
     <p>You will receive periodic updates about new additions to our catalog.</p>`;
    
  return sendEmail({
    to: email,
    from: 'notifications@designgallery.example.com', // This should be a verified sender in SendGrid
    subject,
    text,
    html,
  });
}