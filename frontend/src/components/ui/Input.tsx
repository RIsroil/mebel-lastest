import type { InputHTMLAttributes } from 'react'
import { forwardRef, useState } from 'react'
import { cn } from '@/utils/cn'
import styles from './Input.module.css'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?:      string
  error?:      string
  showToggle?: boolean  // parol ko'rsatish/yashirish tugmasi
}

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    // Ko'z ochiq — parol ko'rinadi
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    // Ko'z yopiq — parol yashirilgan
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, showToggle, type, className, ...rest }, ref) => {
    const [visible, setVisible] = useState(false)

    const isPassword = type === 'password'
    const effectiveType = isPassword && showToggle
      ? (visible ? 'text' : 'password')
      : type

    return (
      <div className={styles.group}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.wrapper}>
          <input
            ref={ref}
            type={effectiveType}
            className={cn(
              styles.input,
              error && styles.hasError,
              isPassword && showToggle && styles.withToggle,
              className
            )}
            {...rest}
          />
          {isPassword && showToggle && (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setVisible((v) => !v)}
              tabIndex={-1}
              aria-label={visible ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
            >
              <EyeIcon open={visible} />
            </button>
          )}
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
