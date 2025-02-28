import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./providers/ThemeProvider";
import "./index.css";
import { setupOfflineListeners } from "./lib/offline-forms";
import {
  handleAppInstalled,
  registerServiceWorker,
  setupServiceWorkerUpdateFlow,
} from "./service-worker-registration";

// Create root for React rendering
createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);

// Register service worker for offline support
registerServiceWorker();

// Set up service worker update flow
setupServiceWorkerUpdateFlow();

// Handle app installation events
handleAppInstalled();

// Setup offline form submission listeners
setupOfflineListeners();
