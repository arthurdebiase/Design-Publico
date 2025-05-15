import React, { ReactNode } from "react";

interface MasonryGridProps {
  children: ReactNode;
  columns?: number;
  gap?: number;
}

export function MasonryGrid({ 
  children, 
  columns = 3, 
  gap = 6 
}: MasonryGridProps) {
  const childrenArray = React.Children.toArray(children);
  
  // Aplicar grid baseado no número de colunas
  const getGridColsClass = () => {
    switch(columns) {
      case 1: return "grid-cols-1";
      case 2: return "grid-cols-2";
      case 3: return "grid-cols-3";
      case 4: return "grid-cols-4";
      default: return "grid-cols-3";
    }
  };
  
  // Aplicar gap baseado no valor
  const getGapClass = () => {
    switch(gap) {
      case 4: return "gap-4";
      case 6: return "gap-6";
      case 8: return "gap-8";
      default: return "gap-6";
    }
  };
  
  return (
    <div className={`grid ${getGridColsClass()} ${getGapClass()}`}>
      {childrenArray.map((child, i) => (
        <div key={i}>{child}</div>
      ))}
    </div>
  );
}

// Responsive masonry grid that adjusts columns based on screen width
export function ResponsiveMasonryGrid({ children, gap = 6 }: Omit<MasonryGridProps, "columns">) {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className="w-full">
      {/* Mobile: 1 column */}
      <div className="md:hidden">
        <div className="grid grid-cols-1 gap-6">
          {childrenArray.map((child, i) => (
            <div key={i}>{child}</div>
          ))}
        </div>
      </div>
      
      {/* Tablet: 2 columns */}
      <div className="hidden md:block lg:hidden">
        <div className="grid grid-cols-2 gap-6">
          {childrenArray.map((child, i) => (
            <div key={i}>{child}</div>
          ))}
        </div>
      </div>
      
      {/* Desktop: 3 columns */}
      <div className="hidden lg:block xl:hidden">
        <div className="grid grid-cols-3 gap-6">
          {childrenArray.map((child, i) => (
            <div key={i}>{child}</div>
          ))}
        </div>
      </div>
      
      {/* Large Desktop: 4 columns */}
      <div className="hidden xl:block">
        <div className="grid grid-cols-4 gap-6">
          {childrenArray.map((child, i) => (
            <div key={i}>{child}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
