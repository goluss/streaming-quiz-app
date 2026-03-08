import { NextRequest, NextResponse } from 'next/server'
import { sendTestResultEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { attemptId, email, name, score, totalQuestions, correctCount } = body

    if (!email || score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sent = await sendTestResultEmail({
      to: email,
      studentName: name ?? email,
      score,
      totalQuestions,
      correctCount,
      attemptId,
    })

    return NextResponse.json({ success: sent })
  } catch (error) {
    console.error('[API] send-result-email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
