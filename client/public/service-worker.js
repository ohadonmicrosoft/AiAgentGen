// Service Worker for AI Agent Generator
// Version: 1.0.0

const CACHE_NAME = 'ai-agent-generator-cache-v1';
const RUNTIME_CACHE = 'ai-agent-generator-runtime-v1';

// Resources to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index.css',
  '/assets/index.js',
  '/assets/vendor.js',
  '/assets/ui.js',
  '/assets/form.js',
  '/assets/charts.js',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
];

// API routes that should be network-first with fallback to cache
const API_ROUTES = [
  '/api/user',
  '/api/agents',
  '/api/prompts',
];

// Install event - precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Pre-caching resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Helper function to determine if a request is for an API route
function isApiRoute(url) {
  return API_ROUTES.some(route => url.pathname.startsWith(route));
}

// Helper function to determine if a request is for a static asset
function isStaticAsset(url) {
  return url.pathname.startsWith('/assets/') || 
         url.pathname.startsWith('/static/') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js');
}

// Helper function to determine if a request is for an HTML page
function isHtmlPage(url) {
  return url.pathname === '/' || 
         url.pathname.endsWith('.html') || 
         (!url.pathname.includes('.') && !url.pathname.startsWith('/api/'));
}

// Fetch event - handle requests with appropriate strategies
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Handle API requests - network first with cache fallback
  if (isApiRoute(url)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to store in cache
          const responseToCache = response.clone();
          
          caches.open(RUNTIME_CACHE)
            .then(cache => {
              // Only cache successful responses
              if (response.status === 200) {
                cache.put(event.request, responseToCache);
              }
            });
          
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Handle static assets - cache first with network fallback
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              // Clone the response to store in cache
              const responseToCache = response.clone();
              
              caches.open(RUNTIME_CACHE)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            });
        })
    );
    return;
  }
  
  // Handle HTML pages - network first with cache fallback
  if (isHtmlPage(url)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to store in cache
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // If no cached response, serve the offline page
              return caches.match('/index.html');
            });
        })
    );
    return;
  }
  
  // Default strategy - network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Don't cache non-GET requests
        if (event.request.method !== 'GET') {
          return response;
        }
        
        // Clone the response to store in cache
        const responseToCache = response.clone();
        
        caches.open(RUNTIME_CACHE)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request);
      })
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncForms());
  }
});

// Function to sync stored form submissions
async function syncForms() {
  try {
    // Open the IndexedDB database
    const db = await openDatabase();
    const tx = db.transaction('offline-forms', 'readwrite');
    const store = tx.objectStore('offline-forms');
    
    // Get all stored form submissions
    const forms = await store.getAll();
    
    // Process each form submission
    for (const form of forms) {
      try {
        // Attempt to send the form data
        const response = await fetch(form.url, {
          method: form.method,
          headers: form.headers,
          body: form.body,
          credentials: 'include',
        });
        
        if (response.ok) {
          // If successful, delete the form from storage
          await store.delete(form.id);
        }
      } catch (error) {
        console.error('Failed to sync form:', error);
      }
    }
    
    await tx.complete;
  } catch (error) {
    console.error('Error syncing forms:', error);
  }
}

// Helper function to open the IndexedDB database
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('offline-storage', 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('offline-forms')) {
        db.createObjectStore('offline-forms', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onerror = event => {
      reject(event.target.error);
    };
  });
} 