import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
            title: "Already subscribed",
            description: "This email is already subscribed to our newsletter.",
            variant: "default",
          });
        } else {
          toast({
            title: "Successfully subscribed!",
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
        title: "Subscription failed",
        description: "Please try again later.",
        variant: "destructive",
      });
      console.error("Newsletter subscription error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    // In a real app, this would update the app's locale/language state
    toast({
      title: "Language changed",
      description: `Interface language set to ${
        value === "en" ? "English" : 
        value === "pt" ? "Portuguese" : 
        value === "es" ? "Spanish" : "English"
      }`,
    });
  };

  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Logo and description column */}
          <div className="md:col-span-4 space-y-4">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-[#0066FF] rounded-md flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <span className="text-xl font-bold">DesignGallery</span>
            </Link>
            
            <p className="text-gray-600 max-w-md">
              A comprehensive collection of design examples from real-world applications, 
              powered by Airtable integration.
            </p>
            
            {/* Language selector */}
            <div className="mt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <Globe className="h-4 w-4" />
                <span>Select language:</span>
              </div>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Navigation links grid */}
          <div className="md:col-span-4">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li><Link href="/" className="text-gray-600 hover:text-[#0066FF] transition-colors">Gallery</Link></li>
                  <li><Link href="/collections" className="text-gray-600 hover:text-[#0066FF] transition-colors">Collections</Link></li>
                  <li><Link href="/categories" className="text-gray-600 hover:text-[#0066FF] transition-colors">Categories</Link></li>
                  <li><Link href="/platforms" className="text-gray-600 hover:text-[#0066FF] transition-colors">Platforms</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
                <ul className="space-y-2">
                  <li><Link href="/about" className="text-gray-600 hover:text-[#0066FF] transition-colors">About</Link></li>
                  <li><Link href="/contact" className="text-gray-600 hover:text-[#0066FF] transition-colors">Contact</Link></li>
                  <li><Link href="/privacy" className="text-gray-600 hover:text-[#0066FF] transition-colors">Privacy</Link></li>
                  <li><Link href="/terms" className="text-gray-600 hover:text-[#0066FF] transition-colors">Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Newsletter subscription */}
          <div className="md:col-span-4">
            <h3 className="font-semibold text-gray-900 mb-4">Subscribe to our newsletter</h3>
            <p className="text-gray-600 mb-4">
              Stay updated with the latest design trends and new additions to our gallery.
            </p>
            
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email address"
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
                  {isSubmitting ? "Subscribing..." : "Subscribe"}
                </Button>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>We respect your privacy. Unsubscribe anytime.</span>
              </div>
            </form>
          </div>
        </div>
        
        {/* Bottom section with copyright and social links */}
        <div className="border-t border-gray-200 mt-10 pt-10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm mb-6 md:mb-0">
            © {new Date().getFullYear()} DesignGallery. All rights reserved.
          </p>
          
          <div className="flex space-x-6">
            <a href="#" className="text-gray-500 hover:text-[#0066FF] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </a>
            <a href="#" className="text-gray-500 hover:text-[#0066FF] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="#" className="text-gray-500 hover:text-[#0066FF] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                <path d="M9 18c-4.51 2-5-2-7-2"></path>
              </svg>
            </a>
            <a href="#" className="text-gray-500 hover:text-[#0066FF] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
