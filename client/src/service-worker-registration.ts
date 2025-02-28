// Service worker registration for offline capabilities and caching

/**
 * Register the service worker
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
          
          // Check for updates when the page loads
          registration.update();
          
          // Setup update checking
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check for updates every hour
        })
        .catch(error => {
          console.error('ServiceWorker registration failed: ', error);
        });
    });
  }
}

/**
 * Check if a service worker update is available and prompt user to refresh
 */
export function setupServiceWorkerUpdateFlow() {
  if ('serviceWorker' in navigator) {
    // Add listener for when a new service worker is installed but waiting
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // When the service worker controlling this page changes, refresh the page
      window.location.reload();
    });
    
    // Detect when a new service worker is installed but waiting
    navigator.serviceWorker.ready.then(registration => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is installed but waiting
              // Show notification to the user
              notifyUserOfUpdate();
            }
          });
        }
      });
    });
  }
}

/**
 * Show a notification to the user that an update is available
 */
function notifyUserOfUpdate() {
  // Create a notification element
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50 flex flex-col';
  notification.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <strong>Update Available</strong>
      <button id="close-update-notification" class="text-sm hover:bg-primary-foreground/10 rounded-full h-6 w-6 flex items-center justify-center">✕</button>
    </div>
    <p class="text-sm mb-2">A new version of the app is available.</p>
    <div class="flex justify-end space-x-2">
      <button id="update-later" class="text-sm hover:underline">Later</button>
      <button id="update-now" class="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-sm px-3 py-1 rounded-md">Update Now</button>
    </div>
  `;
  
  // Add the notification to the page
  document.body.appendChild(notification);
  
  // Handle update action
  document.getElementById('update-now')?.addEventListener('click', () => {
    // Skip the waiting service worker
    navigator.serviceWorker.ready.then(registration => {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    });
    
    // Remove the notification
    notification.remove();
  });
  
  // Handle close action
  document.getElementById('close-update-notification')?.addEventListener('click', () => {
    notification.remove();
  });
  
  // Handle later action
  document.getElementById('update-later')?.addEventListener('click', () => {
    notification.remove();
  });
}

/**
 * Install event - this is called when the app is installed
 */
export function handleAppInstalled() {
  window.addEventListener('appinstalled', (event) => {
    console.log('AI Agent Generator was installed', event);
    // Track app installation
    if (window.gtag) {
      window.gtag('event', 'app_installed');
    }
  });
}

// Declare global gtag function
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
} 