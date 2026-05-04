import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/common.types'
import type { TokenPair } from '@/types/auth.types'
import { useAuthStore } from '@/store/auth.store'

const api = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
})

// Auth endpointlari o'z 401/404larini kutadi — refresh logiciga tushmasligi kerak
const AUTH_ONLY_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh-token']
const isAuthOnlyPath = (url?: string) =>
  AUTH_ONLY_PATHS.some((p) => url?.includes(p))

// ── Request interceptor — har so'rovga Bearer token qo'shadi ─────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor — 401 bo'lsa token yangilab retry qiladi ────────────
let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const flushQueue = (token: string | null, err: unknown = null) => {
  pendingQueue.forEach((p) => (token ? p.resolve(token) : p.reject(err)))
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retried?: boolean }

    // Login/register/refresh so'rovlarida 401 kutilgan xato — o'tkazib yuboramiz
    if (isAuthOnlyPath(original.url)) {
      return Promise.reject(error)
    }

    // Boshqa endpointlar uchun: 401 → token refresh → retry
    if (error.response?.status === 401 && !original._retried) {
      original._retried = true
      const { refreshToken, setTokens, logout } = useAuthStore.getState()

      if (!refreshToken) {
        logout()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              if (original.headers) original.headers.Authorization = `Bearer ${token}`
              resolve(api(original))
            },
            reject,
          })
        })
      }

      isRefreshing = true
      try {
        const { data } = await axios.post<ApiResponse<TokenPair>>(
          '/api/auth/refresh-token',
          refreshToken,
          { headers: { 'Content-Type': 'application/json' } }
        )
        const tokens = data.data
        setTokens(tokens)
        flushQueue(tokens.accessToken)
        if (original.headers) original.headers.Authorization = `Bearer ${tokens.accessToken}`
        return api(original)
      } catch (refreshError) {
        flushQueue(null, refreshError)
        logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
