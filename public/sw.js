// Service Worker - Handles offline caching and synchronization
const CACHE_NAME = 'brutal-score-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
];

// Install Event - Cache essential files
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('Failed to cache some files:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network first, cache fallback
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Strategy: Network first for HTML, cache first for others
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            return caches.match('/offline.html') || new Response('Offline');
          });
        })
    );
  } else {
    // Cache first for assets
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(request).then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
  }
});

// Message Event - Handle messages from clients
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push Event - Handle push notifications
self.addEventListener('push', (event: PushEvent) => {
  const options = {
    body: event.data?.text() || 'New notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification('Brutal Score', options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    (self as any).clients.matchAll({ type: 'window' }).then((clients: any[]) => {
      // Check if there's already a window open with the target URL
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if ((self as any).clients.openWindow) {
        return (self as any).clients.openWindow('/');
      }
    })
  );
});

// Background Sync Event - Sync data when back online
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-test-results') {
    event.waitUntil(syncTestResults());
  }
});

async function syncTestResults() {
  try {
    // This would typically call an API to sync stored data
    console.log('Syncing test results...');
    // TODO: Implement actual sync logic
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}

// Export for TypeScript
export {};
