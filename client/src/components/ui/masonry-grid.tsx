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
  
  // Create columns based on the number specified
  const columnWrapper = {};
  const result = [];
  
  // Create column arrays
  for (let i = 0; i < columns; i++) {
    columnWrapper[`column${i}`] = [];
  }
  
  // Distribute children among columns
  for (let i = 0; i < childrenArray.length; i++) {
    const columnIndex = i % columns;
    columnWrapper[`column${columnIndex}`].push(
      <div key={i} className={i > 0 ? `pt-${gap}` : ""}>
        {childrenArray[i]}
      </div>
    );
  }
  
  // Prepare the jsx for each column
  for (let i = 0; i < columns; i++) {
    result.push(
      <div
        key={i}
        className="flex flex-col"
        style={{
          flex: 1,
          marginLeft: i > 0 ? `${gap * 4}px` : 0,
        }}
      >
        {columnWrapper[`column${i}`]}
      </div>
    );
  }
  
  return (
    <div className="flex w-full">
      {result}
    </div>
  );
}

// Responsive masonry grid that adjusts columns based on screen width
export function ResponsiveMasonryGrid({ children, gap = 6 }: Omit<MasonryGridProps, "columns">) {
  // Use different columns based on screen size
  return (
    <div className="w-full">
      {/* Mobile: 1 column */}
      <div className="md:hidden">
        <MasonryGrid columns={1} gap={gap}>
          {children}
        </MasonryGrid>
      </div>
      
      {/* Tablet: 2 columns */}
      <div className="hidden md:block lg:hidden">
        <MasonryGrid columns={2} gap={gap}>
          {children}
        </MasonryGrid>
      </div>
      
      {/* Desktop: 3 columns */}
      <div className="hidden lg:block xl:hidden">
        <MasonryGrid columns={3} gap={gap}>
          {children}
        </MasonryGrid>
      </div>
      
      {/* Large Desktop: 4 columns */}
      <div className="hidden xl:block">
        <MasonryGrid columns={4} gap={gap}>
          {children}
        </MasonryGrid>
      </div>
    </div>
  );
}
