import { useCallback, useEffect, useRef, useState } from 'react'

export function useCountdown(initialCount = 3) {
  const [count, setCount] = useState(null)
  const timeoutRef = useRef(null)

  const clearCountdown = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const startCountdown = useCallback(() => {
    clearCountdown()

    return new Promise((resolve) => {
      let currentCount = initialCount
      setCount(currentCount)

      const tick = () => {
        currentCount -= 1

        if (currentCount <= 0) {
          setCount(null)
          resolve()
          return
        }

        setCount(currentCount)
        timeoutRef.current = setTimeout(tick, 1000)
      }

      timeoutRef.current = setTimeout(tick, 1000)
    })
  }, [clearCountdown, initialCount])

  useEffect(() => {
    return () => {
      clearCountdown()
    }
  }, [clearCountdown])

  return {
    count,
    isCountingDown: count !== null,
    startCountdown,
  }
}
