'use client'

import { useState } from 'react'
import { Bell, BellOff, BellRing, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications } from '@/components/notification-provider'
import { motion, AnimatePresence } from 'framer-motion'

export function NotificationBell() {
  const { 
    permission, 
    isSubscribed, 
    isSupported, 
    subscribe, 
    unsubscribe,
    requestPermission 
  } = useNotifications()
  const [isAnimating, setIsAnimating] = useState(false)

  if (!isSupported) {
    return null
  }

  const handleEnable = async () => {
    setIsAnimating(true)
    if (permission !== 'granted') {
      await requestPermission()
    }
    await subscribe()
    setIsAnimating(false)
  }

  const handleDisable = async () => {
    await unsubscribe()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <AnimatePresence mode="wait">
            {isSubscribed ? (
              <motion.div
                key="subscribed"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
              >
                <BellRing className="h-5 w-5 text-green-600" />
              </motion.div>
            ) : permission === 'denied' ? (
              <motion.div
                key="denied"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
              >
                <BellOff className="h-5 w-5 text-red-500" />
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
              >
                <Bell className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {isSubscribed && (
            <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-3">
          {permission === 'denied' ? (
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <X className="h-4 w-4" />
                <span>Notifications blocked</span>
              </div>
              <p className="text-xs">
                Enable notifications in your browser settings to receive SOS alerts and updates.
              </p>
            </div>
          ) : isSubscribed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Notifications enabled</span>
              </div>
              <p className="text-xs text-muted-foreground">
                You'll receive alerts for SOS emergencies, booking updates, and crowd warnings.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleDisable}
              >
                <BellOff className="h-4 w-4 mr-2" />
                Disable notifications
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enable notifications to receive real-time alerts for:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 🚨 SOS emergencies</li>
                <li>• 📋 Booking confirmations</li>
                <li>• ✅ Check-in updates</li>
                <li>• ⚠️ Crowd warnings</li>
              </ul>
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                size="sm"
                onClick={handleEnable}
                disabled={isAnimating}
              >
                {isAnimating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                  </motion.div>
                ) : (
                  <BellRing className="h-4 w-4 mr-2" />
                )}
                Enable notifications
              </Button>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
