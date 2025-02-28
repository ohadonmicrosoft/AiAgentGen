import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./providers/ThemeProvider";
import App from "./App";
import "./index.css";
import { registerServiceWorker, setupServiceWorkerUpdateFlow, handleAppInstalled } from "./service-worker-registration";
import { setupOfflineListeners } from "./lib/offline-forms";

// Create root for React rendering
createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

// Register service worker for offline support
registerServiceWorker();

// Set up service worker update flow
setupServiceWorkerUpdateFlow();

// Handle app installation events
handleAppInstalled();

// Setup offline form submission listeners
setupOfflineListeners();
