import type { Question } from './test-generator'

/**
 * AI Question Generation Stub
 *
 * Phase 1: Returns mock questions for UI testing.
 * Phase 2: Replace with real GPT-4 / Gemini API call.
 *
 * Expected output format:
 * 30 MCQs, each with 4 labeled options (A-D) and exactly one correct answer.
 */
export async function generateQuestionsFromTranscript(
  transcriptContent: string,
  transcriptId: string,
  count = 30
): Promise<Omit<Question, 'id'>[]> {
  // ── Phase 2: uncomment and configure ──────────────────────
  // const OpenAI = (await import('openai')).default
  // const client = new OpenAI()
  // const response = await client.chat.completions.create({ ... })
  // return parseAIResponse(response)
  // ─────────────────────────────────────────────────────────

  console.log(
    `[AI Stub] Would generate ${count} questions from transcript "${transcriptId}" (${transcriptContent.length} chars)`
  )

  // Return mock questions for UI testing
  return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    transcript_id: transcriptId,
    question_text: `Sample Question ${i + 1}: What does this transcript primarily discuss?`,
    options: [
      { label: 'A' as const, text: 'Topic A – the main subject' },
      { label: 'B' as const, text: 'Topic B – a secondary concept' },
      { label: 'C' as const, text: 'Topic C – an unrelated concept' },
      { label: 'D' as const, text: 'Topic D – another unrelated concept' },
    ],
    correct_answer: 'A' as const,
    category: 'General',
  }))
}
