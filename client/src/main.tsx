import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import i18n configuration
import "./i18n";
// Import performance monitoring
import { setupPerformanceMonitoring } from "./lib/performance";

// Setup performance observer to replace deprecated API
setupPerformanceMonitoring();

createRoot(document.getElementById("root")!).render(<App />);
