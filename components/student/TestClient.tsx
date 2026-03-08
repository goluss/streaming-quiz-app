'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateRandomizedTest, gradeTest, type RandomizedQuestion } from '@/lib/test-generator'
import { useRouter } from 'next/navigation'
import { sendTestResultEmail } from '@/lib/email'

interface Props {
  questions: {
    id: string
    transcript_id: string
    question_text: string
    options: { label: 'A' | 'B' | 'C' | 'D'; text: string }[]
    correct_answer: 'A' | 'B' | 'C' | 'D'
    category?: string | null
  }[]
  testId: string
  transcriptId: string | null
  user: { id: string; email: string; name?: string | null }
  fixedCount?: number
}

import { verifyTestCode, submitTestAttempt } from '@/app/student/tests/actions'

export default function TestClient({ questions, testId, transcriptId, user, fixedCount }: Props) {
  const [randomizedTest, setRandomizedTest] = useState<RandomizedQuestion[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    setRandomizedTest(generateRandomizedTest(questions, fixedCount ?? 5))
    setIsMounted(true)
  }, [questions, fixedCount])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const currentQuestion = randomizedTest[currentIdx]
  const totalQuestions = randomizedTest.length
  const progress = ((currentIdx) / totalQuestions) * 100
  const isAnswered = !!answers[currentQuestion?.id]
  const isLastQuestion = currentIdx === totalQuestions - 1

  const handleAnswerSelect = useCallback((answer: string) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }))
  }, [currentQuestion])

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx((prev) => prev - 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const result = gradeTest(randomizedTest, answers)

    const response = await submitTestAttempt({
      testId,
      transcriptId,
      score: result.score,
      totalQuestions: result.total_questions,
      correctCount: result.correct_count,
      answers: result.answers
    })

    if (response.success && response.attemptId) {
      // Trigger email (fire-and-forget in Phase 1)
      fetch('/api/send-result-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: response.attemptId,
          email: user.email,
          name: user.name ?? user.email,
          score: result.score,
          totalQuestions: result.total_questions,
          correctCount: result.correct_count,
        }),
      }).catch(() => {}) // non-blocking

      // Navigate to the results review page (hard redirect to bypass Nextjs client-render router caching bugs)
      window.location.href = `/student/results/${response.attemptId}`
    } else {
      console.error('Failed to save attempt:', response.error)
      alert(`Failed to save quiz attempt! Reason: ${response.error}. Please take a screenshot of this error.`)
      setSubmitting(false)
    }
  }

  if (!isMounted) return null

  if (!currentQuestion) {
    return <div className="text-slate-400 text-center py-20">No questions available.</div>
  }

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
          <span>Progress: Question {currentIdx + 1} of {totalQuestions}</span>
          <span>{Object.keys(answers).length} of {totalQuestions} Answered</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#003B71] rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,59,113,0.3)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-xl relative overflow-hidden min-h-[220px]">
        {currentQuestion.category && (
          <span className="inline-block mb-6 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-[#003B71] border border-indigo-100 rounded-full">
            {currentQuestion.category}
          </span>
        )}
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug tracking-tight">
          {currentQuestion.question_text}
        </h2>
      </div>

      {/* Answer Options */}
      <div className="grid grid-cols-1 gap-4">
        {currentQuestion.shuffled_options.map((option) => {
          const selected = answers[currentQuestion.id] === option.label
          return (
            <button
              key={option.label}
              id={`option-${option.label}`}
              onClick={() => handleAnswerSelect(option.label)}
              className={`w-full text-left px-6 py-5 rounded-2xl border-2 transition-all flex items-center gap-5 group shadow-sm ${
                selected
                  ? 'bg-indigo-50 border-[#003B71] ring-1 ring-[#003B71]/10'
                  : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all shrink-0 ${
                selected ? 'bg-[#003B71] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
              }`}>
                {option.label}
              </span>
              <span className={`text-base font-bold tracking-tight transition-colors ${selected ? 'text-slate-900' : 'text-slate-600'}`}>
                {option.text}
              </span>
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-8 border-t border-slate-100">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
        >
          ← Previous Question
        </button>

        {isLastQuestion ? (
          <button
            id="submit-quiz-btn"
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length === 0}
            className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95"
          >
            {submitting ? 'Processing Submission...' : `Submit Quiz (${Object.keys(answers).length}/${totalQuestions} Answered)`}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-10 py-4 bg-[#003B71] hover:bg-[#00264d] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95"
          >
            Next Question →
          </button>
        )}
      </div>

      {/* Question Navigator */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <p className="text-xs text-slate-500 mb-3">Jump to question</p>
        <div className="flex flex-wrap gap-2">
          {randomizedTest.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`w-8 h-8 text-xs rounded-lg font-medium transition-colors ${
                i === currentIdx
                  ? 'bg-indigo-600 text-white'
                  : answers[randomizedTest[i].id]
                  ? 'bg-slate-700 text-emerald-400'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
