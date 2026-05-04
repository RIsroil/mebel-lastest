import { useState, useRef, useEffect } from 'react'

// Har bir ketma-ket xatoda kutish vaqti oshib boradi (soniyada)
const STEPS = [5, 10, 30, 60]

interface CooldownResult {
  remaining: number    // qolgan soniyalar
  isLocked:  boolean   // hozir kutish davri bormi
  attempts:  number    // jami urinishlar soni
  trigger:   () => void // xato bo'lganda chaqiriladi
  reset:     () => void // muvaffaqiyatli logindan keyin chaqiriladi
}

export const useCooldown = (): CooldownResult => {
  const [remaining, setRemaining]  = useState(0)
  const attemptsRef = useRef(0)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const trigger = () => {
    clearTimer()
    const idx     = Math.min(attemptsRef.current, STEPS.length - 1)
    const seconds = STEPS[idx]
    attemptsRef.current += 1
    setRemaining(seconds)

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const reset = () => {
    clearTimer()
    attemptsRef.current = 0
    setRemaining(0)
  }

  // Unmount bo'lganda timer tozalansin
  useEffect(() => clearTimer, [])

  return { remaining, isLocked: remaining > 0, attempts: attemptsRef.current, trigger, reset }
}
