import { createClient } from '@/lib/supabase/server'
import AnalyticsClient from '@/components/admin/AnalyticsClient'

export const metadata = { title: 'Analytics – Admin | Training Portal' }

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const [{ data: attempts }, { data: questions }, { data: loginActivity }] = await Promise.all([
    supabase
      .from('test_attempts')
      .select('id, score, answers_provided, created_at, test_id, profiles(email, full_name), tests(name)')
      .order('created_at', { ascending: false }),
    supabase.from('questions').select('id, question_text, category'),
    supabase.from('login_activity').select('*').order('created_at', { ascending: false }).limit(200),
  ])

  return <AnalyticsClient attempts={attempts ?? []} questions={questions ?? []} loginActivity={loginActivity ?? []} />
}
