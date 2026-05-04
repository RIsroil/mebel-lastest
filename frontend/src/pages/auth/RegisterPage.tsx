import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCooldown } from '@/hooks/useCooldown'
import { getApiError } from '@/utils/apiError'
import AuthCard from '@/components/auth/AuthCard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import styles from './LoginPage.module.css'

const schema = z.object({
  username: z.string().min(3, "Kamida 3 ta belgi"),
  password: z.string().min(4, "Kamida 4 ta belgi"),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Parollar mos kelmadi",
  path:    ['confirm'],
})

type FormData = z.infer<typeof schema>

const RegisterPage = () => {
  const { register: registerUser }              = useAuth()
  const navigate                                = useNavigate()
  const [serverError, setServerError]           = useState('')
  const { remaining, isLocked, trigger, reset } = useCooldown()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setServerError('')
      await registerUser({ username: data.username, password: data.password })
      reset()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      trigger()
      setServerError(getApiError(err))
    }
  }

  return (
    <AuthCard title="Ro'yxatdan o'tish" subtitle="Owner sifatida kirish">
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Username"
          placeholder="owner_user"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />

        <Input
          label="Parol"
          type="password"
          showToggle
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Parolni tasdiqlash"
          type="password"
          showToggle
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />

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
          Ro'yxatdan o'tish →
        </Button>

        <p className={styles.footer} style={{ marginTop: 14 }}>
          Hisobingiz bormi?{' '}
          <Link to="/login" className={styles.footerLink}>
            Kirish
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

export default RegisterPage
