'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { toast } from 'sonner'

interface NotificationContextType {
  permission: NotificationPermission
  isSubscribed: boolean
  isSupported: boolean
  requestPermission: () => Promise<NotificationPermission>
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  sendNotification: (title: string, options?: NotificationOptions) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  
  const isSupported = typeof window !== 'undefined' && 
    'Notification' in window && 
    'serviceWorker' in navigator

  // Register service worker on mount
  useEffect(() => {
    if (!isSupported) return

    async function registerSW() {
      try {
        // Check current permission
        setPermission(Notification.permission)

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })
        
        setSwRegistration(registration)
        console.log('[Notifications] Service worker registered')

        // Check if already subscribed
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error('[Notifications] SW registration failed:', error)
      }
    }

    registerSW()
  }, [isSupported])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied' as NotificationPermission

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        toast.success('Notifications enabled!')
      } else if (result === 'denied') {
        toast.error('Notifications blocked. Enable in browser settings.')
      }
      
      return result
    } catch (error) {
      console.error('[Notifications] Permission request failed:', error)
      return 'denied' as NotificationPermission
    }
  }, [isSupported])

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!swRegistration || permission !== 'granted') {
      const newPermission = await requestPermission()
      if (newPermission !== 'granted') return false
    }

    try {
      // Get VAPID public key from server
      const response = await fetch('/api/notifications?action=vapid-key')
      const { publicKey } = await response.json()

      if (!publicKey) {
        // Use browser notifications only (no push)
        setIsSubscribed(true)
        toast.success('Browser notifications enabled')
        return true
      }

      // Subscribe to push
      const subscription = await swRegistration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      })

      // Send subscription to server
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: 'user-' + Date.now() // Replace with actual user ID
        })
      })

      setIsSubscribed(true)
      toast.success('Push notifications enabled!')
      return true
    } catch (error) {
      console.error('[Notifications] Subscribe failed:', error)
      // Fallback to browser notifications only
      setIsSubscribed(true)
      toast.info('Browser notifications enabled (push unavailable)')
      return true
    }
  }, [swRegistration, permission, requestPermission])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    try {
      if (swRegistration) {
        const subscription = await swRegistration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
          await fetch(`/api/notifications?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
            method: 'DELETE'
          })
        }
      }
      
      setIsSubscribed(false)
      toast.info('Notifications disabled')
      return true
    } catch (error) {
      console.error('[Notifications] Unsubscribe failed:', error)
      return false
    }
  }, [swRegistration])

  // Send a local notification
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      console.warn('[Notifications] Permission not granted')
      return
    }

    try {
      // Use service worker for notification if available
      if (swRegistration) {
        swRegistration.showNotification(title, {
          icon: '/logo.png',
          badge: '/logo.png',
          ...options
        })
      } else {
        // Fallback to Notification API
        new Notification(title, {
          icon: '/logo.png',
          ...options
        })
      }
    } catch (error) {
      console.error('[Notifications] Failed to show notification:', error)
    }
  }, [permission, swRegistration])

  return (
    <NotificationContext.Provider
      value={{
        permission,
        isSubscribed,
        isSupported,
        requestPermission,
        subscribe,
        unsubscribe,
        sendNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}
