import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, Menu } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
    // Navigate to search results
    // navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#0066FF] rounded-md flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="text-lg font-semibold">DesignGallery</span>
          </Link>
        </div>
        
        {/* Search Bar (Desktop) */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Search apps or screens..."
              className="w-full py-2 px-4 bg-[#F5F5F5] border border-gray-200 rounded-md pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>
        </form>
        
        {/* Navigation (Desktop) */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className={`text-[#333333] hover:text-[#0066FF] font-medium ${location === '/' ? 'text-[#0066FF]' : ''}`}>
            Gallery
          </Link>
          <Link href="/collections" className={`text-[#333333] hover:text-[#0066FF] font-medium ${location === '/collections' ? 'text-[#0066FF]' : ''}`}>
            Collections
          </Link>
          <Link href="/about" className={`text-[#333333] hover:text-[#0066FF] font-medium ${location === '/about' ? 'text-[#0066FF]' : ''}`}>
            About
          </Link>
          <Button className="bg-[#0066FF] hover:bg-blue-700 text-white">Submit App</Button>
        </nav>
        
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="mt-8 flex flex-col space-y-4">
              <Link href="/" className="text-lg font-medium hover:text-[#0066FF]">
                Gallery
              </Link>
              <Link href="/collections" className="text-lg font-medium hover:text-[#0066FF]">
                Collections
              </Link>
              <Link href="/about" className="text-lg font-medium hover:text-[#0066FF]">
                About
              </Link>
              <Button className="bg-[#0066FF] hover:bg-blue-700 text-white mt-4">
                Submit App
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Mobile Search Bar */}
      <form onSubmit={handleSearch} className="md:hidden px-4 pb-4">
        <div className="relative w-full">
          <Input
            type="text"
            placeholder="Search apps or screens..."
            className="w-full py-2 px-4 bg-[#F5F5F5] border border-gray-200 rounded-md pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        </div>
      </form>
    </header>
  );
}
