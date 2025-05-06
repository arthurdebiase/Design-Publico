import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from "@/components/language-selector";
import symbolLogo from "@/assets/designpublico-symbol.svg";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState("pt"); // Default to Portuguese for newsletter
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    try {
      // Call our API endpoint to subscribe to the newsletter
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          language
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.alreadySubscribed) {
          toast({
            title: t("newsletter.success"),
            description: "This email is already subscribed to our newsletter.",
            variant: "default",
          });
        } else {
          toast({
            title: t("newsletter.success"),
            description: "You'll receive our newsletter updates soon.",
            variant: "default",
          });
        }
        setEmail("");
      } else {
        throw new Error(data.message || "Failed to subscribe");
      }
    } catch (error) {
      toast({
        title: t("newsletter.error"),
        description: "Please try again later.",
        variant: "destructive",
      });
      console.error("Newsletter subscription error:", error);
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
              <div className="w-8 h-8 rounded-md flex items-center justify-center">
                <img 
                  src={symbolLogo} 
                  alt="Design Público Logo" 
                  className="h-full w-auto rounded-md"
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
          </div>
          
          {/* Newsletter subscription */}
          <div className="md:col-span-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('newsletter.title')}</h3>
            <p className="text-gray-600 mb-4">
              {t('newsletter.subtitle')}
            </p>
            
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={t('newsletter.placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-grow"
                  required
                />
                <Button 
                  type="submit" 
                  className="bg-[#0066FF] hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "..." : t('newsletter.button')}
                </Button>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>We respect your privacy. Unsubscribe anytime.</span>
              </div>
            </form>
          </div>
        </div>
        
        {/* Bottom section with copyright and language selector */}
        <div className="border-t border-gray-200 mt-10 pt-10 pb-8 flex flex-col md:flex-row justify-center items-center">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-gray-600 text-sm mb-2 md:mb-0">
              {t('footer.copyright')}
            </p>
            <LanguageSelector />
          </div>
        </div>
      </div>
    </footer>
  );
}
