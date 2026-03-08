'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginTracker() {
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Log activity if not already logged in this window session
        const loggedInKey = `logged_in_${session.user.id}`
        if (!sessionStorage.getItem(loggedInKey)) {
          await supabase.from('login_activity').insert({
            user_id: session.user.id,
            user_email: session.user.email,
            ip_address: 'client-side',
            user_agent: navigator.userAgent
          })
          sessionStorage.setItem(loggedInKey, 'true')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return null
}
