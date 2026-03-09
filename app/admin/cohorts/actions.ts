'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assignResource(params: {
  cohortId: string
  sessionId?: string | null
  title: string
  url: string
  type: string
  filePath?: string | null
  sectionTitle?: string | null
}) {
  const supabase = await createClient()

  // Convert empty string to null to avoid UUID validation errors
  const sessionId = params.sessionId === '' ? null : (params.sessionId || null)

  try {
    const { data, error } = await supabase
      .from('cohort_resources')
      .insert({
        cohort_id: params.cohortId,
        session_id: sessionId,
        title: params.title,
        url: params.url,
        type: params.type,
        file_path: params.filePath || null,
        section_title: params.sectionTitle || 'Session Materials'
      })
      .select()
      .single()

    if (error) {
      console.error('Database Error in assignResource:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/cohorts/${params.cohortId}`)
    return { success: true, data }
  } catch (error: any) {
    console.error('Unexpected error in assignResource:', error)
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}

export async function assignPractice(params: {
  cohortId: string
  sessionId?: string | null
  transcriptId: string
  title: string
  sectionTitle?: string | null
}) {
  const supabase = await createClient()

  // Convert empty string to null to avoid UUID validation errors
  const sessionId = params.sessionId === '' ? null : (params.sessionId || null)

  try {
    const { data, error } = await supabase
      .from('cohort_resources')
      .insert({
        cohort_id: params.cohortId,
        session_id: sessionId,
        title: params.title,
        url: '#', // Placeholder for practice
        type: 'practice',
        transcript_id: params.transcriptId,
        section_title: params.sectionTitle || 'Session Materials'
      })
      .select()
      .single()

    if (error) {
      console.error('Database Error in assignPractice:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/cohorts/${params.cohortId}`)
    return { success: true, data }
  } catch (error: any) {
    console.error('Unexpected error in assignPractice:', error)
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}

export async function renameSession(params: {
  cohortId: string
  sessionId: string
  newTitle: string
}) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('cohort_sessions')
      .update({ title: params.newTitle })
      .eq('id', params.sessionId)
      .eq('cohort_id', params.cohortId) // Ensure it belongs to the cohort
      .select()
      .single()

    if (error) {
      console.error('Database Error in renameSession:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/cohorts/${params.cohortId}`)
    return { success: true, data }
  } catch (error: any) {
    console.error('Unexpected error in renameSession:', error)
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}

export async function removeResource(params: {
  cohortId: string
  resourceId: string
}) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('cohort_resources')
      .delete()
      .eq('id', params.resourceId)
      .eq('cohort_id', params.cohortId) // Ensure it belongs to the cohort to prevent cross-cohort deletions

    if (error) {
      console.error('Database Error in removeResource:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/cohorts/${params.cohortId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Unexpected error in removeResource:', error)
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}
