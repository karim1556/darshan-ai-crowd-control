// DARSHAN.AI Push Notification Service Worker
// This service worker handles push notifications for SOS alerts, booking updates, and crowd warnings

const CACHE_NAME = 'darshan-v1'

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/logo.png',
        '/favicon.ico'
      ])
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch (e) {
    data = {
      title: 'DARSHAN.AI Notification',
      body: event.data.text(),
      icon: '/logo.png'
    }
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/logo.png',
    badge: '/logo.png',
    vibrate: data.type === 'sos' ? [200, 100, 200, 100, 200] : [100, 50, 100],
    tag: data.tag || `darshan-${Date.now()}`,
    requireInteraction: data.type === 'sos' || data.severity === 'critical',
    actions: getActionsForType(data.type),
    data: {
      url: data.url || '/',
      type: data.type,
      id: data.id
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'DARSHAN.AI', options)
  )
})

// Get action buttons based on notification type
function getActionsForType(type) {
  switch (type) {
    case 'sos':
      return [
        { action: 'respond', title: '🚨 Respond', icon: '/logo.png' },
        { action: 'view', title: '👁️ View Details', icon: '/logo.png' }
      ]
    case 'booking':
      return [
        { action: 'view', title: '📋 View Ticket', icon: '/logo.png' }
      ]
    case 'crowd':
      return [
        { action: 'view', title: '📊 View Status', icon: '/logo.png' },
        { action: 'reroute', title: '🔀 Alternative Route', icon: '/logo.png' }
      ]
    case 'checkin':
      return [
        { action: 'view', title: '✅ View Pass', icon: '/logo.png' }
      ]
    default:
      return [
        { action: 'view', title: 'View', icon: '/logo.png' }
      ]
  }
}

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  let targetUrl = '/'

  // Determine target URL based on action and notification type
  if (event.action === 'respond' && data.type === 'sos') {
    targetUrl = data.url || '/medical'
  } else if (event.action === 'view') {
    switch (data.type) {
      case 'booking':
      case 'checkin':
        targetUrl = data.id ? `/pilgrim/ticket/${data.id}` : '/pilgrim'
        break
      case 'sos':
        targetUrl = '/medical'
        break
      case 'crowd':
        targetUrl = '/admin'
        break
      default:
        targetUrl = data.url || '/'
    }
  } else if (event.action === 'reroute') {
    targetUrl = '/pilgrim?reroute=true'
  } else {
    targetUrl = data.url || '/'
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus and navigate
        for (const client of clientList) {
          if ('focus' in client && 'navigate' in client) {
            return client.focus().then(() => client.navigate(targetUrl))
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})

// Notification close event - track dismissed notifications
self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data || {}
  
  // Could send analytics here
  console.log('[SW] Notification closed:', data.type, data.id)
})

// Background sync for offline SOS submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sos') {
    event.waitUntil(syncSOSRequests())
  } else if (event.tag === 'sync-checkin') {
    event.waitUntil(syncCheckins())
  }
})

async function syncSOSRequests() {
  // Get pending SOS from IndexedDB and submit
  const db = await openDB()
  const pendingSOS = await db.getAll('pending-sos')
  
  for (const sos of pendingSOS) {
    try {
      await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sos)
      })
      await db.delete('pending-sos', sos.id)
    } catch (e) {
      console.error('[SW] Failed to sync SOS:', e)
    }
  }
}

async function syncCheckins() {
  // Get pending check-ins and submit
  const db = await openDB()
  const pendingCheckins = await db.getAll('pending-checkins')
  
  for (const checkin of pendingCheckins) {
    try {
      await fetch('/api/booking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: checkin.bookingId, action: 'check-in' })
      })
      await db.delete('pending-checkins', checkin.id)
    } catch (e) {
      console.error('[SW] Failed to sync check-in:', e)
    }
  }
}

// Simple IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('darshan-offline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      resolve({
        getAll: (store) => {
          return new Promise((res, rej) => {
            const tx = db.transaction(store, 'readonly')
            const req = tx.objectStore(store).getAll()
            req.onsuccess = () => res(req.result)
            req.onerror = () => rej(req.error)
          })
        },
        delete: (store, key) => {
          return new Promise((res, rej) => {
            const tx = db.transaction(store, 'readwrite')
            const req = tx.objectStore(store).delete(key)
            req.onsuccess = () => res()
            req.onerror = () => rej(req.error)
          })
        }
      })
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('pending-sos')) {
        db.createObjectStore('pending-sos', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('pending-checkins')) {
        db.createObjectStore('pending-checkins', { keyPath: 'id' })
      }
    }
  })
}

// Periodic background sync for crowd updates (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'crowd-check') {
    event.waitUntil(checkCrowdStatus())
  }
})

async function checkCrowdStatus() {
  try {
    const response = await fetch('/api/zones')
    const zones = await response.json()
    
    // Check for critical crowd levels
    const criticalZones = zones.filter(z => z.crowd_level === 'Critical')
    
    if (criticalZones.length > 0) {
      self.registration.showNotification('⚠️ Crowd Alert', {
        body: `${criticalZones.map(z => z.zone_name).join(', ')} at critical capacity`,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'crowd-warning',
        data: { type: 'crowd', url: '/admin' }
      })
    }
  } catch (e) {
    console.error('[SW] Crowd check failed:', e)
  }
}
