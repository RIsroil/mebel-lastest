import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCooldown } from '@/hooks/useCooldown'
import { getApiError, isBlockedError } from '@/utils/apiError'
import type { UserRole } from '@/types/auth.types'
import AuthCard from '@/components/auth/AuthCard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import styles from './LoginPage.module.css'

const schema = z.object({
  username: z.string().min(1, "Username kiritish shart"),
  password: z.string().min(1, "Parol kiritish shart"),
})

type FormData = z.infer<typeof schema>

const ROLE_HOME: Record<UserRole, string> = {
  OWNER:  '/dashboard',
  WORKER: '/check-in',
  ADMIN:  '/admin/users',
}

const LoginPage = () => {
  const { login }                           = useAuth()
  const navigate                            = useNavigate()
  const [serverError, setServerError]       = useState('')
  const { remaining, isLocked, trigger, reset } = useCooldown()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setServerError('')
      const role = await login(data)
      reset()
      navigate(ROLE_HOME[role], { replace: true })
    } catch (err) {
      trigger() // cooldown boshlash
      if (isBlockedError(err)) {
        navigate('/blocked')
      } else {
        setServerError(getApiError(err))
      }
    }
  }

  return (
    <AuthCard title="Mebel MS" subtitle="Mebel ishlab chiqarish tizimi">
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Username"
          placeholder="username"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />

        <div>
          <Input
            label="Parol"
            type="password"
            showToggle
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className={styles.forgotRow}>
            <span className={styles.forgotLink}>Parolni unutdingizmi?</span>
          </div>
        </div>

        {serverError && (
          <div className={styles.serverError}>
            <span>⚠</span> {serverError}
          </div>
        )}

        {isLocked && (
          <div className={styles.cooldownNotice}>
            🕐 Qayta urinishdan oldin {remaining} soniya kuting
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isSubmitting}
          disabled={isLocked}
        >
          Kirish →
        </Button>

        <div className={styles.divider} />

        <p className={styles.footer}>
          Hisob yo'qmi?{' '}
          <Link to="/register" className={styles.footerLink}>
            Ro'yxatdan o'tish
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

export default LoginPage
