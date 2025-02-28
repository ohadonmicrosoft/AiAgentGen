import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for offline form data
 */
interface OfflineFormData {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  retries: number;
}

/**
 * Options for submitting a form
 */
interface SubmitFormOptions {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data: any;
  headers?: Record<string, string>;
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Open the IndexedDB database for offline storage
 */
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('offline-storage', 1);
    
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('offline-forms')) {
        db.createObjectStore('offline-forms', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onerror = (event: Event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Save a form submission for later processing
 */
async function saveFormForLater(formData: OfflineFormData): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction('offline-forms', 'readwrite');
    const store = tx.objectStore('offline-forms');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.add(formData);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Request a sync when back online if supported
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-forms');
    }
  } catch (error) {
    console.error('Failed to save form for later:', error);
    throw new Error('Failed to save form for offline submission');
  }
}

/**
 * Submit a form with offline support
 * @param options Form submission options
 * @returns Promise that resolves with the response data
 */
export async function submitForm<T = any>(options: SubmitFormOptions): Promise<T> {
  const { url, method, data, headers = {} } = options;
  
  // Default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // Combine headers
  const combinedHeaders = {
    ...defaultHeaders,
    ...headers,
  };
  
  // Prepare the form data
  const formData: OfflineFormData = {
    id: uuidv4(),
    url,
    method,
    headers: combinedHeaders,
    body: JSON.stringify(data),
    timestamp: Date.now(),
    retries: 0,
  };
  
  // If online, try to submit normally
  if (isOnline()) {
    try {
      const response = await fetch(url, {
        method,
        headers: combinedHeaders,
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      // If fetch fails due to network issues, save for later
      if (error instanceof TypeError || !isOnline()) {
        await saveFormForLater(formData);
        return { 
          _offlineSubmitted: true, 
          _formId: formData.id,
          message: 'Form saved for submission when online'
        } as unknown as T;
      }
      
      // Re-throw other errors
      throw error;
    }
  } else {
    // If offline, save for later
    await saveFormForLater(formData);
    return { 
      _offlineSubmitted: true, 
      _formId: formData.id,
      message: 'Form saved for submission when online'
    } as unknown as T;
  }
}

/**
 * Get all pending offline form submissions
 */
export async function getPendingForms(): Promise<OfflineFormData[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction('offline-forms', 'readonly');
    const store = tx.objectStore('offline-forms');
    
    return new Promise<OfflineFormData[]>((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get pending forms:', error);
    return [];
  }
}

/**
 * Manually trigger synchronization of offline forms
 */
export async function syncOfflineForms(): Promise<{ success: number; failed: number }> {
  try {
    const forms = await getPendingForms();
    let success = 0;
    let failed = 0;
    
    for (const form of forms) {
      try {
        const response = await fetch(form.url, {
          method: form.method,
          headers: form.headers,
          body: form.body,
          credentials: 'include',
        });
        
        if (response.ok) {
          // If successful, delete the form
          const db = await openDatabase();
          const tx = db.transaction('offline-forms', 'readwrite');
          const store = tx.objectStore('offline-forms');
          await store.delete(form.id);
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }
    
    return { success, failed };
  } catch (error) {
    console.error('Failed to sync offline forms:', error);
    return { success: 0, failed: 0 };
  }
}

/**
 * Add event listeners for online/offline events
 */
export function setupOfflineListeners(): void {
  // When coming back online, try to sync forms
  window.addEventListener('online', async () => {
    console.log('Back online, attempting to sync forms');
    
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-forms');
    } else {
      // Fallback for browsers without background sync
      await syncOfflineForms();
    }
  });
  
  // When going offline, notify the user
  window.addEventListener('offline', () => {
    console.log('Offline mode activated');
    // You could show a notification here
  });
} 