import { Resend } from 'resend'

export interface TestResultEmailData {
  to: string
  studentName: string
  score: number
  totalQuestions: number
  correctCount: number
  attemptId: string
}

/**
 * Send test result email to the student.
 * In Phase 1 this logs to console in dev; Phase 2 enables real sending.
 */
export async function sendTestResultEmail(data: TestResultEmailData): Promise<boolean> {
  const { to, studentName, score, totalQuestions, correctCount, attemptId } = data
  const passed = score >= 70
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
    console.log('[Email Stub] Would send result email:', {
      to,
      studentName,
      score,
      passed,
    })
    return true
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@yourdomain.com',
      to,
      subject: `Your Assessment Results – ${passed ? '✅ Passed' : '❌ Needs Review'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #1e293b;">Assessment Complete</h1>
          <p>Hi ${studentName},</p>
          <p>You've completed your assessment. Here are your results:</p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-size: 32px; font-weight: bold; color: ${passed ? '#16a34a' : '#dc2626'}; margin: 0;">
              ${score.toFixed(1)}%
            </p>
            <p style="color: #64748b; margin: 4px 0 0;">${correctCount} / ${totalQuestions} correct</p>
            <p style="color: ${passed ? '#16a34a' : '#dc2626'}; font-weight: 600; margin: 8px 0 0;">
              ${passed ? '✅ Passed' : '❌ Did not pass (70% required)'}
            </p>
          </div>
          <a href="${appUrl}/student/results/${attemptId}" 
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 8px;">
            Review Your Answers →
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            Training Portal
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('[Email] Failed to send result email:', error)
    return false
  }
}
