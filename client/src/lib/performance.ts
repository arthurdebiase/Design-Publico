/**
 * Performance monitoring module
 * Replaces deprecated getEntriesByType method with PerformanceObserver for various web metrics
 */

// This function sets up PerformanceObservers to capture various paint entries
// which replaces the deprecated performance.getEntriesByType() methods
export function setupPerformanceMonitoring() {
  try {
    // Create observers for different types of performance metrics
    
    // 1. Observer for paint metrics (first-paint, first-contentful-paint)
    const paintObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // We can log or handle the entry here if needed
        // console.log('Paint entry:', entry.name, entry);
      });
    });
    
    // 2. Observer for largest contentful paint (replaces target-contentful-paint)
    const lcpObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // console.log('Largest contentful paint entry:', entry);
      });
    });
    
    // 3. Observer for layout shifts (cumulative layout shift metric)
    const layoutShiftObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // console.log('Layout shift entry:', entry);
      });
    });
    
    // 4. Observer for first input delay
    const fidObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // console.log('First input delay entry:', entry);
      });
    });
    
    // Start observing the different types of entries
    paintObserver.observe({ type: 'paint', buffered: true });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    layoutShiftObserver.observe({ type: 'layout-shift', buffered: true });
    fidObserver.observe({ type: 'first-input', buffered: true });
    
    // Return the observers if needed
    return {
      paintObserver,
      lcpObserver,
      layoutShiftObserver,
      fidObserver
    };
  } catch (error) {
    console.error('Error setting up performance observers:', error);
    return null;
  }
}