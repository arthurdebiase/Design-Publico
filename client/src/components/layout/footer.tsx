import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
// Use the logo from the root directory
const symbolLogo = "/designpublico-symbol.png";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language || "pt"; // Default to Portuguese
  
  // Max character limit for email (prevent abuse)
  const EMAIL_MAX_LENGTH = 100;
  
  // Fetch subscriber count when component mounts
  useEffect(() => {
    async function fetchSubscriberCount() {
      try {
        const response = await fetch('/api/newsletter/subscribers');
        if (response.ok) {
          const data = await response.json();
          setSubscriberCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching subscriber count:", error);
      }
    }
    
    fetchSubscriberCount();
  }, []);

  // Email validation function
  const validateEmail = (email: string): boolean => {
    // Regular expression for email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };
  
  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Enforce maximum length
    if (value.length > EMAIL_MAX_LENGTH) {
      setEmailError(t('newsletter.emailTooLong'));
      setEmail(value.slice(0, EMAIL_MAX_LENGTH));
      return;
    }
    
    setEmail(value);
    
    // Clear error when field is empty or when typing after an error
    if (!value || emailError) {
      setEmailError(null);
    }
  };
  
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email validation
    if (!email) {
      setEmailError(t('newsletter.emailRequired'));
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError(t('newsletter.invalidEmail'));
      return;
    }
    
    // Clear any previous errors
    setEmailError(null);
    setIsSubmitting(true);
    setFormStatus("loading");
    
    try {
      // Call our API endpoint to subscribe to the newsletter
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          language: currentLanguage, // Use the current UI language
          name: "" // We don't collect name in the form currently
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setFormStatus("success");
        
        // Update subscriber count if provided
        if (data.subscriberCount !== undefined) {
          setSubscriberCount(data.subscriberCount);
        }
        
        toast({
          title: t("newsletter.success"),
          description: t("newsletter.successDesc"),
          variant: "default",
        });
        setEmail("");
        
        // Reset form status after a delay
        setTimeout(() => {
          setFormStatus("idle");
        }, 3000);
      } else {
        throw new Error(data.message || "Failed to subscribe");
      }
    } catch (error) {
      setFormStatus("error");
      toast({
        title: t("newsletter.error"),
        description: t("newsletter.errorDesc"),
        variant: "destructive",
      });
      console.error("Newsletter subscription error:", error);
      
      // Reset form status after a delay
      setTimeout(() => {
        setFormStatus("idle");
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200 pt-12 mt-0">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Logo and description column */}
          <div className="md:col-span-6 space-y-4">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 flex items-center justify-center">
                <img 
                  src={symbolLogo} 
                  alt="Design Público Logo" 
                  className="h-full w-auto"
                />
              </div>
              <span className="flex items-center">
                <span style={{ fontFamily: 'Arial Black, Arial', fontWeight: 900 }}>DESIGN</span>
                <span style={{ fontFamily: 'Arial', fontWeight: 700 }} className="ml-1">PÚBLICO</span>
              </span>
            </Link>
            
            <p className="text-gray-600 max-w-md">
              {t('about.description')}
            </p>
            
            {/* Subscriber count removed as requested */}
          </div>
          
          {/* Newsletter subscription */}
          <div className="md:col-span-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('newsletter.title')}</h3>
            <p className="text-gray-600 mb-4">
              {t('newsletter.subtitle')}
            </p>
            
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Input
                    type="email"
                    placeholder={t('newsletter.placeholder')}
                    value={email}
                    onChange={handleEmailChange}
                    maxLength={EMAIL_MAX_LENGTH}
                    className={`w-full pr-9 ${
                      formStatus === "success" ? "border-green-500 focus-visible:ring-green-500" : 
                      formStatus === "error" || emailError ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                    required
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "email-error" : undefined}
                    disabled={isSubmitting || formStatus === "success"}
                  />
                  {formStatus === "success" && (
                    <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4" />
                  )}
                  {formStatus === "error" && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 h-4 w-4" />
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="bg-[#0066FF] hover:bg-blue-700"
                  disabled={isSubmitting || formStatus === "success"}
                >
                  {isSubmitting ? t('newsletter.submitting') : 
                   formStatus === "success" ? t('newsletter.subscribed') : 
                   t('newsletter.button')}
                </Button>
              </div>
              {/* Email validation error message */}
              {emailError && (
                <p id="email-error" className="text-sm text-red-600 mt-2">
                  {emailError}
                </p>
              )}
              
              {/* Success message */}
              {formStatus === "success" && (
                <p className="text-sm text-green-600 mt-2">
                  {t('newsletter.thankyou')}
                </p>
              )}
              
              {/* Server error message */}
              {formStatus === "error" && !emailError && (
                <p className="text-sm text-red-600 mt-2">
                  {t('newsletter.tryAgain')}
                </p>
              )}
            </form>
          </div>
        </div>
        
        {/* Bottom section with copyright */}
        <div className="border-t border-gray-200 mt-10 pt-10 pb-8 flex justify-center items-center">
          <p className="text-gray-600 text-sm text-center">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
