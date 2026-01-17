"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth, UserRole } from "@/lib/auth-context"
import { 
  Mail, 
  Lock, 
  User, 
  ArrowLeft, 
  Loader2,
  Users,
  Shield,
  Heart,
  BarChart3,
  Eye,
  EyeOff,
  ChevronDown,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"

const roleOptions: { role: UserRole; label: string; icon: any; color: string; description: string }[] = [
  { role: 'pilgrim', label: 'Pilgrim', icon: Users, color: 'from-amber-500 to-orange-500', description: 'Book darshan & view tickets' },
  { role: 'admin', label: 'Temple Admin', icon: BarChart3, color: 'from-emerald-500 to-teal-500', description: 'Manage temple operations' },
  { role: 'police', label: 'Police/Security', icon: Shield, color: 'from-blue-500 to-cyan-500', description: 'Security & crowd control' },
  { role: 'medical', label: 'Medical Team', icon: Heart, color: 'from-red-500 to-pink-500', description: 'Emergency medical response' },
]

function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [selectedRole, setSelectedRole] = useState<UserRole>('pilgrim')
  const [showPassword, setShowPassword] = useState(false)
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  const { signIn, signUp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  const selectedRoleData = roleOptions.find(r => r.role === selectedRole)!
  const SelectedIcon = selectedRoleData.icon

  const getRoleRedirect = (role: UserRole) => {
    switch(role) {
      case 'admin': return '/admin'
      case 'police': return '/police'
      case 'medical': return '/medical'
      default: return '/pilgrim'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError(null)

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          toast.error('Please enter your full name')
          setLoading(false)
          return
        }
        
        const { error } = await signUp(email, password, fullName, selectedRole)
        if (error) {
          toast.error(error.message || 'Sign up failed')
        } else {
          toast.success('Account created! Please check your email to verify.')
          setIsSignUp(false)
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          const msg = error.message || 'Login failed'
          setFormError(msg)
          toast.error(msg)
        } else {
          toast.success('Logged in successfully!')
          // Redirect based on selected role
          const roleRedirect = getRoleRedirect(selectedRole)
          router.push(redirectTo !== '/' ? redirectTo : roleRedirect)
          router.refresh()
        }
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-50 to-amber-100 dark:from-gray-950 dark:via-amber-950/20 dark:to-gray-950" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl" />
      </div>
      
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-0 shadow-2xl shadow-black/10">
            {/* Header */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
              
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30"
              >
                <img src="/logo.png" alt="DARSHAN.AI" className="w-14 h-14 object-contain" />
              </motion.div>
              
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isSignUp ? 'Join the DARSHAN.AI community' : 'Sign in to continue'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                /* Full Name */
                <div>
                  <label className="text-sm font-medium mb-2 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Role Selection Dropdown */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {isSignUp ? 'Select Your Role' : 'Login As'}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background flex items-center justify-between hover:border-amber-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedRoleData.color} flex items-center justify-center shadow-lg`}>
                        <SelectedIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{selectedRoleData.label}</div>
                        <div className="text-xs text-muted-foreground">{selectedRoleData.description}</div>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showRoleDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl border border-border shadow-xl z-20 overflow-hidden"
                    >
                      {roleOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <button
                            key={option.role}
                            type="button"
                            onClick={() => {
                              setSelectedRole(option.role)
                              setShowRoleDropdown(false)
                            }}
                            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors ${
                              selectedRole === option.role ? 'bg-amber-50 dark:bg-amber-900/20' : ''
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center shadow-lg`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left flex-1">
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                            {selectedRole === option.role && (
                              <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/25"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            {/* Toggle Sign Up / Sign In */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </span>{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-amber-600 font-semibold hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
            
            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
                {formError}
              </div>
            )}
          </Card>
          
          {/* Extra Info */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            🙏 By signing in, you agree to our terms of service
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 via-orange-50 to-amber-100">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
