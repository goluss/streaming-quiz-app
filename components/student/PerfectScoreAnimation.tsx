'use client'

import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'

interface Props {
  score: number
}

export default function PerfectScoreAnimation({ score }: Props) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (score === 100) {
      setShowConfetti(true)
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [score])

  if (!showConfetti) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div className="absolute inset-0 bg-yellow-500/10 animate-pulse mix-blend-overlay"></div>
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        colors={['#FFD700', '#FDB931', '#FFDF00', '#D4AF37', '#B8860B']}
        numberOfPieces={400}
        gravity={0.15}
        recycle={false}
      />
    </div>
  )
}
