'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function setActiveCohort(cohortId: string) {
  const cookieStore = await cookies()
  cookieStore.set('active_cohort_id', cohortId, {
    path: '/',
    httpOnly: false, // Needs to be readable client-side for nav
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
  })
  redirect('/student')
}

export async function setCohortCookie(cohortId: string) {
  const cookieStore = await cookies()
  cookieStore.set('active_cohort_id', cohortId, {
    path: '/',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  })
}
