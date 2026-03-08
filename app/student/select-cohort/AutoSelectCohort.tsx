'use client'

import { useEffect } from 'react'
import { setCohortCookie } from './actions'

export default function AutoSelectCohort({ cohortId }: { cohortId: string }) {
  useEffect(() => {
    setCohortCookie(cohortId).then(() => {
      // Force a hard navigation so the browser officially sends the newly set cookie in the request headers
      // Soft router pushes can sometimes trigger a race condition with the Next.js App Router Cache
      window.location.href = '/student'
    })
  }, [cohortId])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 border-4 border-[#003B71] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Entering Portal...</p>
    </div>
  )
}
