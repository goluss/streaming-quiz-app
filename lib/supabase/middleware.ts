import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  console.log(`[Middleware] Handling ${request.method} ${request.nextUrl.pathname}`)
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add any logic between createServerClient and
  // supabase.auth.getUser() — it could cause hard-to-debug session issues.
  console.log(`[Middleware] Calling getUser()`)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  console.log(`[Middleware] user found: ${!!user}`)

  const url = request.nextUrl.clone()
  const isAuthPage = url.pathname.startsWith('/login') || url.pathname.startsWith('/auth')
  const isAdminPage = url.pathname.startsWith('/admin')
  const isStudentPage = url.pathname.startsWith('/student')
  const isSetupPage = url.pathname === '/setup-profile'

  if (!user && (isAdminPage || isStudentPage || isSetupPage)) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    console.log(`[Middleware] Fetching profile for ${user.id}`)
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, company, company_email')
      .eq('id', user.id)
      .single()
    console.log(`[Middleware] profile found: ${!!profile}`)

    const needsSetup = !profile?.first_name || !profile?.last_name || !profile?.company || !profile?.company_email

    // Force setup if needed (only on GET requests so we don't intercept Server Actions)
    if (needsSetup && !isSetupPage && !isAuthPage && request.method === 'GET') {
      url.pathname = '/setup-profile'
      return NextResponse.redirect(url)
    }

    // Redirect away from setup page if already complete (only on GET requests)
    if (!needsSetup && isSetupPage && request.method === 'GET') {
      url.pathname = '/student'
      return NextResponse.redirect(url)
    }

    // Redirect away from auth pages if logged in
    if (isAuthPage && !url.pathname.startsWith('/auth/callback')) {
      url.pathname = needsSetup ? '/setup-profile' : '/student'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
