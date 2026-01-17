import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Get our custom auth token cookie
  const authToken = request.cookies.get('sb-auth-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Try to get user from the session
  let user = null
  
  // If we have our custom auth token, use it to set the session
  if (authToken && refreshToken) {
    try {
      const { data } = await supabase.auth.setSession({
        access_token: decodeURIComponent(authToken),
        refresh_token: decodeURIComponent(refreshToken),
      })
      user = data.user
    } catch (e) {
      console.error('[Middleware] Error setting session:', e)
    }
  }
  
  // Fallback: try to get user from Supabase's default session
  if (!user) {
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/unauthorized']
  const isPublicRoute = publicRoutes.includes(pathname)
  
  // API routes should be accessible (they have their own auth if needed)
  const isApiRoute = pathname.startsWith('/api/')
  
  // Static assets and Next.js internals
  const isStaticRoute = pathname.startsWith('/_next/') || 
                        pathname.startsWith('/favicon') ||
                        pathname.includes('.') // files with extensions

  // Allow public routes, API routes, and static assets
  if (isPublicRoute || isApiRoute || isStaticRoute) {
    return supabaseResponse
  }

  // If no user and trying to access protected route, redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // User is authenticated, get their role from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'pilgrim'

  // Role-based route protection
  const roleProtectedRoutes: Record<string, string[]> = {
    '/admin': ['admin'],
    '/admin/checkin': ['admin'],
    '/police': ['police', 'admin'],
    '/medical': ['medical', 'admin'],
    '/pilgrim': ['pilgrim', 'admin'], // Pilgrims and admins can access pilgrim routes
    '/demo': ['admin'], // Only admins can access demo
  }

  // Check if the route requires specific roles
  for (const [route, allowedRoles] of Object.entries(roleProtectedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(userRole)) {
        const url = request.nextUrl.clone()
        url.pathname = '/unauthorized'
        return NextResponse.redirect(url)
      }
      break
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
