import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '@/api/auth.api'
import { getApiError } from '@/utils/apiError'
import AuthCard from '@/components/auth/AuthCard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import styles from './LoginPage.module.css'

const schema = z.object({
  username: z.string().min(1, "Username kiritish shart"),
})

type FormData = z.infer<typeof schema>

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setServerError('')
      setSuccessMessage('')
      await authApi.forgotPassword(data.username)
      setSuccessMessage('Parol tiklash havolasi yuborildi. Email xabaringizni tekshiring.')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
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
            Revert qilinmoqda...
          </p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Parol Tiklash" subtitle="Hisobingizga qayta kirish">
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Username"
          placeholder="username"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
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
          Tiklash Havolasini Yuborish →
        </Button>

        <div className={styles.divider} />

        <p className={styles.footer}>
          <Link to="/login" className={styles.footerLink}>
            Kirish sahifasiga qaytish
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

export default ForgotPasswordPage
