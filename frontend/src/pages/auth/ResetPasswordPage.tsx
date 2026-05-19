import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '@/api/auth.api'
import { userApi } from '@/api/user.api'
import { useAuthStore } from '@/store/auth.store'
import { getApiError } from '@/utils/apiError'
import AuthCard from '@/components/auth/AuthCard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import styles from './LoginPage.module.css'

const schema = z.object({
  password: z.string().min(6, "Parol kamida 6 ta belgi bo'lishi kerak"),
  confirmPassword: z.string().min(6, "Parol kiritish shart"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Parollar mos kelmadi",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof schema>

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const { setTokens, setAuth } = useAuthStore()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (!token) {
    return (
      <AuthCard title="Parol Tiklash" subtitle="Xatolik">
        <div className={styles.form}>
          <div className={styles.serverError}>
            <span>⚠</span> Tiklash tokeni topilmadi. Iltimos, email xabaridagi havolani tekshiring.
          </div>
          <Button
            fullWidth
            size="lg"
            onClick={() => navigate('/login')}
          >
            Kirish Sahifasiga Qaytish
          </Button>
        </div>
      </AuthCard>
    )
  }

  const onSubmit = async (data: FormData) => {
    try {
      setServerError('')
      setSuccessMessage('')
      const response = await authApi.resetPassword(token, data.password)
      if (response.data?.data) {
        const tokens = response.data.data
        setTokens(tokens)
        const { data: meResp } = await userApi.getMe()
        setAuth(tokens, meResp.data)
        setSuccessMessage('Parol muvaffaqiyatli yangilandi. Dashboard ga o\'tkazilmoqda...')
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1500)
      }
    } catch (err) {
      setServerError(getApiError(err))
    }
  }

  if (successMessage) {
    return (
      <AuthCard title="Parol Tiklash" subtitle="Tiklash jarayoni">
        <div className={styles.form}>
          <div style={{
            background: '#D4EDDA',
            border: '1px solid #C3E6CB',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            fontSize: '13px',
            color: '#155724',
            textAlign: 'center',
          }}>
            ✓ {successMessage}
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>
            O'tkazilmoqda...
          </p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Parol Tiklash" subtitle="Yangi parol o'rnating">
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Yangi Parol"
          type="password"
          showToggle
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Parolni Tasdiqlang"
          type="password"
          showToggle
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {serverError && (
          <div className={styles.serverError}>
            <span>⚠</span> {serverError}
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={isSubmitting}
        >
          Parolni Yangilash →
        </Button>

        <div className={styles.divider} />

        <p className={styles.footer}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className={styles.footerLink}
          >
            Kirish Sahifasiga Qaytish
          </button>
        </p>
      </form>
    </AuthCard>
  )
}

export default ResetPasswordPage
