import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { jsonrepair } from 'jsonrepair'
import { createClient } from '@/lib/supabase/server'

// Replace double quotes with single quotes to prevent JSON corruption
function sanitizeForAI(text: string): string {
  return text
    .replace(/"/g, "'")
    // Anonymize instructor references
    .replace(/\b(said|says|explained|explains|mentioned|noted|told|asks|according to)\s+[A-Z][a-z]+\b/g, 'the material states')
    .replace(/\b[A-Z][a-z]+\s+(said|says|explained|explains|mentioned|noted|told|asks)\b/g, 'the material states')
}

function buildPrompt(title: string, section: string, sectionLabel: string, count: number) {
  return `You are a training assessment expert creating ${count} multiple-choice test questions.

YOUR ONLY JOB: Extract exactly ${count} testable FACTS, CONCEPTS, RULES, or PROCEDURES from the training content below.

STRICT RULES:
1. Output ONLY valid JSON — no explanation, no markdown, no preamble
2. Questions MUST be about the subject matter itself (facts, rules, concepts, skills)
3. Do NOT ask about class logistics, objectives, schedule, or the instructor
4. Do NOT mention any person's name in any question or answer
5. Do NOT ask 'Who said X' or 'What does the instructor say about X'
6. ONLY ask: 'What is X', 'How does X work', 'Why is X important', 'What happens when X'
7. Use single quotes only — never double quotes inside your answer text

JSON FORMAT (exactly this):
{"questions":[{"q":"...","a":"...","b":"...","c":"...","d":"...","ans":"A"}]}
- q: question (max 100 chars)
- a/b/c/d: answer options (max 70 chars each)
- ans: correct letter A B C or D
- CRITICAL: Never use double-quote characters inside your answer text. Use single quotes (') if quoting.

BAD (never do this): "What does the instructor recommend for daily study?"
BAD (never do this): "What did Steven say about X?"
GOOD: "What is the recommended frequency for reviewing training materials?"
GOOD: "Which of the following describes the correct procedure for X?"

Training titled "${title}" — Section: ${sectionLabel}
Content:
${section}`
}

async function generateBatch(
  client: Anthropic,
  title: string,
  section: string,
  sectionLabel: string,
  batchIdx: number,
  count: number
) {
  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 3500,
    messages: [{ role: 'user', content: buildPrompt(title, section, sectionLabel, count) }],
  })

  const raw = response.content[0]?.type === 'text' ? response.content[0].text.trim() : ''
  console.log(`[AI Batch ${batchIdx}] stop_reason:`, response.stop_reason, '| length:', raw.length)

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`Batch ${batchIdx}: No JSON found`)

  // Try to repair and parse; if inner quotes break it, fall back to stripping them
  let parsed: { questions: { q: string; a: string; b: string; c: string; d: string; ans: string; cat: string }[] }
  try {
    parsed = JSON.parse(jsonrepair(jsonMatch[0]))
  } catch {
    // Fallback: replace double quotes ONLY inside JSON string values, not in keys or structure
    // Strategy: replace ":"..."" patterns carefully
    const fallback = jsonMatch[0]
      // Replace inner double-quotes inside JSON values: :"text with "inner" quotes"
      .replace(/(?<=:")((?:[^"\\]|\\.)*)(?=")/g, (inner) => inner.replace(/"/g, "'"))
    try {
      parsed = JSON.parse(jsonrepair(fallback))
    } catch {
      console.error(`[AI Batch ${batchIdx}] raw output:`, raw.slice(0, 500))
      throw new Error(`Batch ${batchIdx}: Could not parse JSON`)
    }
  }

  if (!Array.isArray(parsed.questions)) throw new Error(`Batch ${batchIdx}: Invalid structure`)

  return parsed.questions.map((q) => ({
    question_text: q.q?.replace(/"/g, "'") ?? '',
    options: [
      { label: 'A', text: (q.a ?? '').replace(/"/g, "'") },
      { label: 'B', text: (q.b ?? '').replace(/"/g, "'") },
      { label: 'C', text: (q.c ?? '').replace(/"/g, "'") },
      { label: 'D', text: (q.d ?? '').replace(/"/g, "'") },
    ],
    correct_answer: q.ans ?? 'A',
    category: (q.cat ?? 'General').replace(/"/g, "'"),
  }))
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { transcriptId, content, title, isPractice } = await request.json()
    if (!transcriptId || !content) {
      return NextResponse.json({ error: 'Missing transcriptId or content' }, { status: 400 })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const cleanContent = sanitizeForAI(content)
    
    // Divide into 8 chunks to get 40 questions (5 each)
    // We'll skip the first and last 10% of the transcript which are usually intro/outro filler
    const trimAmount = Math.floor(cleanContent.length * 0.1)
    const body = cleanContent.slice(trimAmount, cleanContent.length - trimAmount) || cleanContent
    
    const numBatches = 8
    const questionsPerBatch = 5
    const charsPerChunk = Math.ceil(body.length / numBatches)
    
    const sections: { text: string; label: string; count: number }[] = []
    for (let i = 0; i < numBatches; i++) {
      const start = i * charsPerChunk
      const chunk = body.slice(start, start + charsPerChunk).trim()
      if (chunk.length > 200) { // Don't send tiny chunks
        sections.push({ text: chunk, label: `Content Segment ${i + 1}`, count: questionsPerBatch })
      }
    }
    
    // Fallback if transcript was short
    if (sections.length === 0) {
      sections.push({ text: body.trim(), label: 'Core Content', count: 40 })
    }

    // Run batches in parallel
    const results = await Promise.allSettled(
      sections.map((s, i) => generateBatch(client, title, s.text.substring(0, 18000), s.label, i, s.count))
    )

    const allQuestions = results.flatMap((r, i) => {
      if (r.status === 'fulfilled') return r.value
      console.warn(`[AI] Section ${i + 1} failed:`, r.reason)
      return []
    })

    if (allQuestions.length === 0) {
      return NextResponse.json({ error: 'All batches failed — no questions generated' }, { status: 500 })
    }

    const rows = allQuestions.map((q) => ({
      transcript_id: transcriptId,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      category: q.category,
      is_practice: false
    }))

    const { data: inserted, error: dbError } = await supabase
      .from('questions').insert(rows).select('id')

    if (dbError) {
      console.error('[AI] DB insert failed:', dbError)
      // Check if it's the specific missing column error
      if (dbError.message.includes('is_practice')) {
        throw new Error(`DB insert failed: The 'is_practice' column is missing from the 'questions' table. Please run the migration SQL. (${dbError.message})`)
      }
      throw new Error(`DB insert failed: ${dbError.message}`)
    }

    return NextResponse.json({ success: true, count: inserted?.length ?? rows.length })
  } catch (error) {
    console.error('[AI] Question generation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
