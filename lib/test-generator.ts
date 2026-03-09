export interface QuestionOption {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
}

export interface Question {
  id: string
  transcript_id: string
  question_text: string
  options: QuestionOption[]
  correct_answer: 'A' | 'B' | 'C' | 'D'
  category?: string | null
}

export interface RandomizedQuestion extends Question {
  shuffled_options: QuestionOption[]
  shuffled_correct_answer: 'A' | 'B' | 'C' | 'D'
}

export interface AnswerRecord {
  question_id: string
  chosen_answer: string
  correct_answer: string
  is_correct: boolean
}

export interface TestResult {
  attempt_id: string
  score: number
  total_questions: number
  correct_count: number
  answers: AnswerRecord[]
  randomized_questions: RandomizedQuestion[]
}

/**
 * Fisher-Yates shuffle — in-place, returns the same array reference.
 */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Shuffle the options within a question and re-map the correct answer label.
 */
function shuffleQuestionOptions(question: Question): RandomizedQuestion {
  const shuffled = shuffle([...question.options])

  // Find which new label corresponds to the original correct answer text
  const correctOptionText = question.options.find(
    (o) => o.label === question.correct_answer
  )?.text

  const newCorrectLabel = shuffled.find((o) => o.text === correctOptionText)
    ?.label ?? question.correct_answer

  // Re-label options A, B, C, D in their new shuffled positions
  const relabeled = shuffled.map((o, i) => ({
    ...o,
    label: (['A', 'B', 'C', 'D'] as const)[i],
  }))

  const newCorrectRelabeled = relabeled.find(
    (o) => o.text === correctOptionText
  )?.label ?? question.correct_answer

  return {
    ...question,
    shuffled_options: relabeled,
    shuffled_correct_answer: newCorrectRelabeled,
  }
}

/**
 * Generate a fully randomized test from the question bank.
 * - Questions are shuffled into a random order.
 * - Answer options within each question are also shuffled.
 * - Optional: limit to N questions (defaults to all).
 */
export function generateRandomizedTest(
  questions: Question[],
  maxQuestions?: number,
  shuffleQuestions: boolean = true
): RandomizedQuestion[] {
  const pool = shuffleQuestions ? shuffle([...questions]) : [...questions]
  const selected = maxQuestions ? pool.slice(0, maxQuestions) : pool
  return selected.map(shuffleQuestionOptions)
}

/**
 * Grade a completed test: compare chosen answers to shuffled correct answers.
 */
export function gradeTest(
  randomizedQuestions: RandomizedQuestion[],
  chosenAnswers: Record<string, string>
): Omit<TestResult, 'attempt_id'> {
  const answers: AnswerRecord[] = randomizedQuestions.map((q) => {
    const chosen = chosenAnswers[q.id] ?? ''
    const is_correct = chosen === q.shuffled_correct_answer
    return {
      question_id: q.id,
      chosen_answer: chosen,
      correct_answer: q.shuffled_correct_answer,
      is_correct,
      category: q.category ?? null,
    }
  })

  const correct_count = answers.filter((a) => a.is_correct).length
  const total_questions = answers.length
  const score = total_questions > 0 ? (correct_count / total_questions) * 100 : 0

  return {
    score: Math.round(score),
    total_questions,
    correct_count,
    answers,
    randomized_questions: randomizedQuestions,
  }
}
