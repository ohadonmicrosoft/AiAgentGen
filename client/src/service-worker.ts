/// <reference lib="webworker" />

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add your own!

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "ai-agent-generator-cache-v1";

// Assets to precache
const PRECACHE_ASSETS = ["/", "/index.html", "/manifest.json", "/favicon.ico"];

// Assets that should be cached when visited
const RUNTIME_CACHE_PATTERNS = [
  /\.(?:js|css)$/, // JS and CSS files
  /\.(?:png|jpg|jpeg|svg|gif)$/, // Image files
  /^https:\/\/fonts\.googleapis\.com/, // Google Fonts CSS
  /^https:\/\/fonts\.gstatic\.com/, // Google Fonts files
];

// API patterns that should not be cached
const API_PATTERNS = [/\/api\//, /\/auth\//];

// Install event - precache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Precaching assets"); // eslint-disable-line no-console
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter(
          (cacheName) => !currentCaches.includes(cacheName),
        );
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch event - respond with cached resources when available
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Don't cache API requests
  if (API_PATTERNS.some((pattern) => pattern.test(event.request.url))) {
    return;
  }

  // For HTML pages, use a network-first strategy
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache a copy of the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match("/");
          });
        }),
    );
    return;
  }

  // For other resources, use a cache-first strategy for matching patterns
  if (
    RUNTIME_CACHE_PATTERNS.some((pattern) => pattern.test(event.request.url))
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response
          return cachedResponse;
        }

        // If not in cache, fetch from network
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response.ok) {
            return response;
          }

          // Cache a copy of the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return response;
        });
      }),
    );
    return;
  }

  // For all other requests, go to the network first
  event.respondWith(
    fetch(event.request).catch(() => {
      // If network fails, try to serve from cache
      return caches.match(event.request);
    }),
  );
});

// Handle service worker messaging
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Handle background sync for offline form submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-forms") {
    event.waitUntil(syncForms());
  }
});

// Function to sync stored form data
async function syncForms() {
  // Implementation for syncing stored form data when back online
  const db = await openDB();
  const offlineForms = await db.getAll("offline-forms");

  for (const form of offlineForms) {
    try {
      const response = await fetch(form.url, {
        method: form.method,
        headers: form.headers,
        body: form.body,
      });

      if (response.ok) {
        await db.delete("offline-forms", form.id);
      }
    } catch (error) {
      console.error("Sync failed for form:", form, error); // eslint-disable-line no-console
    }
  }
}

// IndexedDB for offline storage
async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("offline-db", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("offline-forms")) {
        db.createObjectStore("offline-forms", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
