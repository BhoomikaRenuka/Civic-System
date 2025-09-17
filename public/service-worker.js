const CACHE_NAME = "civic-report-v2"
const STATIC_CACHE = "civic-report-static-v2"
const DYNAMIC_CACHE = "civic-report-dynamic-v2"

// Assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/login",
  "/register",
  "/report",
  "/my-reports",
  "/issues",
  "/solved",
  "/manifest.json",
  "/icon-192x192.jpg",
  "/icon-512x512.jpg",
  // Add other static assets as needed
]

// API endpoints to cache
const API_CACHE_PATTERNS = [/^https?:\/\/localhost:5000\/issues/, /^https?:\/\/localhost:5000\/myreports/]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...")
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets")
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log("[SW] Static assets cached successfully")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("[SW] Failed to cache static assets:", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[SW] Service worker activated")
        return self.clients.claim()
      }),
  )
})

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Handle API requests
  if (url.origin === "http://localhost:5000") {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets and pages
  event.respondWith(handleStaticRequest(request))
})

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)

  try {
    // Try network first
    const networkResponse = await fetch(request)

    // Cache successful responses for specific endpoints
    if (networkResponse.ok && shouldCacheApiResponse(url)) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log("[SW] Network failed for API request, trying cache:", url.pathname)

    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline response for specific endpoints
    if (url.pathname.includes("/issues") || url.pathname.includes("/myreports")) {
      return new Response(
        JSON.stringify({
          issues: [],
          offline: true,
          message: "You are offline. Showing cached data when available.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    throw error
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    // Try network
    const networkResponse = await fetch(request)

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log("[SW] Network failed for static request:", request.url)

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      const offlineResponse = await caches.match("/")
      if (offlineResponse) {
        return offlineResponse
      }
    }

    throw error
  }
}

// Check if API response should be cached
function shouldCacheApiResponse(url) {
  return API_CACHE_PATTERNS.some((pattern) => pattern.test(url.href))
}

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag)

  if (event.tag === "issue-report") {
    event.waitUntil(syncIssueReports())
  }
})

// Sync offline issue reports
async function syncIssueReports() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    const requests = await cache.keys()

    for (const request of requests) {
      if (request.url.includes("/report") && request.method === "POST") {
        try {
          await fetch(request)
          await cache.delete(request)
          console.log("[SW] Synced offline report:", request.url)
        } catch (error) {
          console.log("[SW] Failed to sync report:", error)
        }
      }
    }
  } catch (error) {
    console.error("[SW] Background sync failed:", error)
  }
}

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received")

  const options = {
    body: event.data ? event.data.text() : "New civic issue update available",
    icon: "/icon-192x192.jpg",
    badge: "/icon-96x96.jpg",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: Math.random(),
    },
    actions: [
      {
        action: "view",
        title: "View Details",
        icon: "/icon-192x192.jpg",
      },
      {
        action: "dismiss",
        title: "Dismiss",
        icon: "/icon-192x192.jpg",
      },
    ],
    requireInteraction: true,
    tag: "civic-report-notification",
  }

  event.waitUntil(self.registration.showNotification("CivicReport", options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action)

  event.notification.close()

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/dashboard"))
  }
})

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed")
})

// Message handling for communication with main thread
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})
