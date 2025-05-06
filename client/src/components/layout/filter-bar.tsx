import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Filter, 
  Tag, 
  X, 
  SortDesc, 
  LayoutGrid, 
  Grid 
} from "lucide-react";
import { AppType, Platform, AppCategory } from "@/types";

interface FilterBarProps {
  onFilterChange: (filters: {
    type?: AppType;
    platform?: Platform;
    category?: AppCategory;
    tag?: string;
  }) => void;
  onSortChange: (sort: string) => void;
  onLayoutChange: (layout: "grid" | "masonry") => void;
  activeFilters: {
    type?: AppType;
    platform?: Platform;
    category?: AppCategory;
    tag?: string;
  };
  activeLayout: "grid" | "masonry";
}

export default function FilterBar({
  onFilterChange,
  onSortChange,
  onLayoutChange,
  activeFilters,
  activeLayout,
}: FilterBarProps) {
  const [filters, setFilters] = useState(activeFilters);
  
  const handleTypeChange = (value: AppType | undefined) => {
    const newFilters = { ...filters, type: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handlePlatformChange = (value: Platform | undefined) => {
    const newFilters = { ...filters, platform: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleCategoryChange = (value: AppCategory | undefined) => {
    const newFilters = { ...filters, category: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const removeTag = () => {
    const newFilters = { ...filters, tag: undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  return (
    <div className="bg-white border-b border-gray-200 py-3 px-4 md:px-6 sticky top-[72px] z-10">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="default" className="px-3 py-1.5 bg-[#0066FF] text-white flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
          
          <Select onValueChange={(value) => handleTypeChange(value === "all" ? undefined : value as AppType)}>
            <SelectTrigger className="w-[160px] px-3 py-1.5 h-auto bg-[#F5F5F5] border border-gray-200">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Federal">Federal</SelectItem>
              <SelectItem value="State">State</SelectItem>
              <SelectItem value="Municipal">Municipal</SelectItem>
            </SelectContent>
          </Select>
          
          <Select onValueChange={(value) => handleCategoryChange(value === "all" ? undefined : value as AppCategory)}>
            <SelectTrigger className="w-[160px] px-3 py-1.5 h-auto bg-[#F5F5F5] border border-gray-200">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Saúde">Saúde</SelectItem>
              <SelectItem value="Trabalho">Trabalho</SelectItem>
              <SelectItem value="Portal">Portal</SelectItem>
              <SelectItem value="Mobilidade">Mobilidade</SelectItem>
              <SelectItem value="Finanças">Finanças</SelectItem>
            </SelectContent>
          </Select>
          
          <Select onValueChange={(value) => handlePlatformChange(value === "all" ? undefined : value as Platform)}>
            <SelectTrigger className="w-[160px] px-3 py-1.5 h-auto bg-[#F5F5F5] border border-gray-200">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="iOS">iOS</SelectItem>
              <SelectItem value="Android">Android</SelectItem>
              <SelectItem value="Web">Web</SelectItem>
              <SelectItem value="Cross-platform">Cross-platform</SelectItem>
            </SelectContent>
          </Select>
          
          {filters.tag && (
            <Badge variant="outline" className="px-3 py-1.5 bg-[#F5F5F5] border border-gray-200 flex items-center gap-2 rounded-md">
              <Tag className="h-4 w-4 text-gray-500" />
              <span>{filters.tag}</span>
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-gray-400 hover:text-gray-600" onClick={removeTag}>
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Select onValueChange={onSortChange}>
            <SelectTrigger className="px-3 py-1.5 h-auto bg-[#F5F5F5] border border-gray-200 flex items-center gap-2">
              <SortDesc className="h-4 w-4 text-gray-500" />
              <span>Sort</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="screens_desc">Most Screens</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex rounded-md overflow-hidden border border-gray-200">
            <Button 
              variant={activeLayout === "grid" ? "default" : "outline"} 
              className={`px-3 py-1.5 ${activeLayout === "grid" ? "bg-[#0066FF] text-white" : "bg-[#F5F5F5] hover:bg-gray-100 border-r border-gray-200"}`}
              onClick={() => onLayoutChange("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={activeLayout === "masonry" ? "default" : "outline"} 
              className={`px-3 py-1.5 ${activeLayout === "masonry" ? "bg-[#0066FF] text-white" : "bg-[#F5F5F5] hover:bg-gray-100"}`}
              onClick={() => onLayoutChange("masonry")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
