'use client'

import { useState, useCallback, useEffect } from 'react'
import { generateRandomizedTest, type RandomizedQuestion } from '@/lib/test-generator'
import Link from 'next/link'
import { CheckCircleIcon, XCircleIcon, ArrowLeftIcon, ArrowRightIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import { submitTestAttempt } from '@/app/student/tests/actions'

interface Props {
  questions: {
    id: string
    transcript_id: string
    question_text: string
    options: { label: 'A' | 'B' | 'C' | 'D'; text: string }[]
    correct_answer: 'A' | 'B' | 'C' | 'D'
    category: string | null
  }[]
  transcriptTitle: string
  transcriptId: string
  cohortId: string | null
}

export default function PracticeClient({ questions, transcriptTitle, transcriptId, cohortId }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [randomizedTest, setRandomizedTest] = useState<RandomizedQuestion[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    setRandomizedTest(generateRandomizedTest(questions, 10, false))
    setIsMounted(true)
  }, [questions])

  const [responses, setResponses] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({})
  const [showFeedback, setShowFeedback] = useState(false)

  
  const currentQuestion = randomizedTest[currentIdx]
  const totalQuestions = randomizedTest.length
  const progress = ((currentIdx + 1) / totalQuestions) * 100
  const userChoice = responses[currentQuestion?.id]
  const isCorrect = userChoice === currentQuestion?.correct_answer

  const handleOptionClick = (label: 'A' | 'B' | 'C' | 'D') => {
    if (showFeedback) return // Prevent changing answer after feedback
    setResponses(prev => ({ ...prev, [currentQuestion.id]: label }))
    setShowFeedback(true)
  }

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(prev => prev + 1)
      setShowFeedback(false)
    }
  }

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1)
      setShowFeedback(true) // Always show feedback if they go back to an answered question
    }
  }

  const handleComplete = async () => {
    if (submitting) return
    setSubmitting(true)
    
    const correctCount = Object.keys(responses).filter(id => {
      const q = randomizedTest.find(rq => rq.id === id)
      return q && responses[id] === q.correct_answer
    }).length
    
    const total = randomizedTest.length
    const score = total > 0 ? (correctCount / total) * 100 : 0
    
    // Format answers for storage (ensure no undefined values to avoid Server Action crashes)
    const answersProvided = randomizedTest.map(q => ({
      question_id: q.id,
      chosen_answer: responses[q.id] ?? '',
      correct_answer: q.correct_answer,
      is_correct: responses[q.id] === q.correct_answer
    }))

    await submitTestAttempt({
      testId: null, // Practice sessions don't have a specific Test ID
      transcriptId,
      cohortId,
      score,
      totalQuestions: total,
      correctCount,
      answers: answersProvided
    })

    window.location.href = '/student'
  }

  if (!isMounted) return null

  if (!currentQuestion) {
    return (
      <div className="text-center py-20">
        <AcademicCapIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">No Practice Questions</h2>
        <p className="text-slate-400 mt-2">There are no practice questions available for this module yet.</p>
        <Link href="/student" className="mt-6 inline-block text-indigo-400 hover:text-indigo-300">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  const isFinished = currentIdx === totalQuestions - 1 && showFeedback

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-6">
        <Link href="/student" className="group text-slate-400 hover:text-[#003B71] text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all">
          <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Practice Mode</h1>
            <p className="text-slate-500 font-medium mt-1">{transcriptTitle}</p>
          </div>
          <div className="shrink-0">
            <span className="text-[10px] font-black text-[#003B71] uppercase tracking-[0.2em] bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm">
              Non-Graded Study
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
          <span>Module Progress</span>
          <span>Question {currentIdx + 1} of {totalQuestions}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#003B71] transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,59,113,0.3)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
           <AcademicCapIcon className="w-32 h-32 text-slate-900" />
        </div>

        <div className="relative z-10">
          {currentQuestion.category && (
            <span className="inline-block px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">
              {currentQuestion.category}
            </span>
          )}
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-[1.35] tracking-tight">
            {currentQuestion.question_text}
          </h2>
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-4">
        {currentQuestion.shuffled_options.map((option) => {
          const isSelected = userChoice === option.label
          const isCorrectAnswer = option.label === currentQuestion.correct_answer
          
          let stateStyles = "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
          
          if (showFeedback) {
            if (isCorrectAnswer) {
              stateStyles = "bg-emerald-50 border-emerald-500/50 text-emerald-800 shadow-emerald-100"
            } else if (isSelected && !isCorrectAnswer) {
              stateStyles = "bg-red-50 border-red-500/50 text-red-800 shadow-red-100"
            } else {
              stateStyles = "bg-white border-slate-100 text-slate-400 opacity-60"
            }
          } else if (isSelected) {
            stateStyles = "bg-indigo-50 border-[#003B71] text-[#003B71] ring-1 ring-[#003B71]/10"
          }

          return (
            <button
              key={option.label}
              disabled={showFeedback}
              onClick={() => handleOptionClick(option.label as any)}
              className={`flex items-center gap-5 p-6 rounded-2xl border text-left transition-all duration-300 group relative overflow-hidden ${stateStyles}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-all shadow-sm ${
                showFeedback && isCorrectAnswer ? 'bg-emerald-500 text-white animate-pulse' :
                showFeedback && isSelected && !isCorrectAnswer ? 'bg-red-500 text-white' :
                isSelected ? 'bg-[#003B71] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
              }`}>
                {option.label}
              </div>
              <span className="text-base md:text-lg font-bold tracking-tight">{option.text}</span>
              
              {showFeedback && isCorrectAnswer && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hidden md:block">Correct</span>
                  <CheckCircleIcon className="w-7 h-7 text-emerald-500 shrink-0 stroke-[2.5]" />
                </div>
              )}
              {showFeedback && isSelected && !isCorrectAnswer && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600 hidden md:block">Incorrect</span>
                  <XCircleIcon className="w-7 h-7 text-red-500 shrink-0 stroke-[2.5]" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Feedback Alert */}
      {showFeedback && (
        <div className={`p-8 rounded-[2rem] border-2 transition-all animate-in zoom-in-95 fade-in duration-500 ${
          isCorrect ? 'bg-emerald-50 border-emerald-100/50' : 'bg-red-50 border-red-100/50'
        }`}>
          <div className="flex items-start gap-6">
            <div className={`p-3 rounded-2xl shrink-0 shadow-sm ${isCorrect ? 'bg-white text-emerald-500' : 'bg-white text-red-500'}`}>
              {isCorrect ? <CheckCircleIcon className="w-8 h-8 stroke-[2.5]" /> : <XCircleIcon className="w-8 h-8 stroke-[2.5]" />}
            </div>
            <div className="flex-1">
              <h4 className={`text-xl font-black tracking-tight ${isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                {isCorrect ? 'That is Correct' : 'Not quite right'}
              </h4>
              <p className={`text-sm md:text-base font-medium mt-2 leading-relaxed ${isCorrect ? 'text-emerald-700/80' : 'text-red-700/80'}`}>
                {isCorrect 
                  ? "Excellent work. You've correctly identified the concept from the training material." 
                  : `The correct answer was ${currentQuestion.correct_answer}. Use this as a learning opportunity for the final assessment.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-8 border-t border-slate-100">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all font-bold uppercase text-[10px] tracking-widest"
        >
          <ArrowLeftIcon className="w-4 h-4 stroke-[2.5]" /> Previous
        </button>

        {isFinished ? (
          <button
            onClick={handleComplete}
            disabled={submitting}
            className="flex items-center gap-2 bg-[#003B71] hover:bg-[#00264d] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Complete Session'} <AcademicCapIcon className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!showFeedback}
            className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 disabled:opacity-0"
          >
            Next Question <ArrowRightIcon className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  )
}
