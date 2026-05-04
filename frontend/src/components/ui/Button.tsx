import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import styles from './Button.module.css'

type Variant = 'primary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   Variant
  size?:      Size
  fullWidth?: boolean
  loading?:   boolean
}

const Button = ({
  variant   = 'primary',
  size      = 'md',
  fullWidth = false,
  loading   = false,
  children,
  className,
  disabled,
  ...rest
}: Props) => (
  <button
    className={cn(
      styles.btn,
      styles[variant],
      styles[size],
      fullWidth && styles.fullWidth,
      className
    )}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? <span className={styles.spinner} /> : children}
  </button>
)

export default Button
