import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './TimeInput24.module.css'

interface TimeInput24Props {
  value: string
  onChange: (val: string) => void
  className?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const TimeInput24 = ({ value, onChange, className }: TimeInput24Props) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })

  const [hour, minute] = useMemo(() => {
    if (!value || !value.includes(':')) return ['09', '00']
    const [h, m] = value.split(':')
    return [h.padStart(2, '0'), (m ?? '00').padStart(2, '0')]
  }, [value])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const setHour = (h: string) => onChange(`${h}:${minute}`)
  const setMinute = (m: string) => onChange(`${hour}:${m}`)

  const handleOpenDropdown = () => {
    setOpen(true)
    if (ref.current) {
      const btn = ref.current.querySelector('button')
      if (btn) {
        const rect = btn.getBoundingClientRect()
        const dropdownWidth = 110 // 2 columns * 52px + gap
        // Ensure dropdown doesn't go off-screen
        let left = rect.left
        if (left + dropdownWidth > window.innerWidth) {
          left = window.innerWidth - dropdownWidth - 8
        }
        if (left < 8) {
          left = 8
        }
        setDropdownPos({
          top: rect.bottom + 4,
          left,
        })
      }
    }
  }

  return (
    <div ref={ref} className={`${styles.wrapper} ${className ?? ''}`}>
      <button
        type="button"
        className={styles.display}
        onClick={() => {
          if (open) setOpen(false)
          else handleOpenDropdown()
        }}
      >
        <span className={styles.time}>{hour}:{minute}</span>
        <span className={styles.icon}>⏱</span>
      </button>
      {open && (
        <div className={styles.dropdown} style={{ top: `${dropdownPos.top}px`, left: `${dropdownPos.left}px` }}>
          <div className={styles.col}>
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                className={`${styles.item} ${h === hour ? styles.selected : ''}`}
                onClick={() => setHour(h)}
              >
                {h}
              </button>
            ))}
          </div>
          <div className={styles.col}>
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                className={`${styles.item} ${m === minute ? styles.selected : ''}`}
                onClick={() => setMinute(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeInput24
