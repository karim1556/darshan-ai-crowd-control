"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ShieldAlert, ArrowLeft, Home, LogIn } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-8 max-w-md text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center"
          >
            <ShieldAlert className="w-10 h-10 text-destructive" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page. Please contact an administrator 
              if you believe this is an error.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </Link>
            <Link href="/login">
              <Button className="gap-2 w-full sm:w-auto">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Error Code: 403 - Forbidden
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
