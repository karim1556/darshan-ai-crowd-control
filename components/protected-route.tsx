"use client"

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, UserRole } from '@/lib/auth-context'
import { motion } from 'framer-motion'
import { Shield, Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles: UserRole[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, role, loading, hasAccess } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo)
      } else if (!hasAccess(allowedRoles)) {
        router.push('/unauthorized')
      }
    }
  }, [user, role, loading, hasAccess, allowedRoles, router, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
        <p className="text-muted-foreground">Verifying access...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    )
  }

  if (!hasAccess(allowedRoles)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Shield className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    )
  }

  return <>{children}</>
}
