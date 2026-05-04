import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/api/auth.api'
import { userApi } from '@/api/user.api'
import type { LoginRequest, RegisterRequest } from '@/types/auth.types'

export const useAuth = () => {
  const { setAuth, setTokens, logout, isAuthenticated, user } = useAuthStore()

  const login = async (body: LoginRequest) => {
    const { data: loginResp } = await authApi.login(body)
    const tokens = loginResp.data
    // Tokenlarni avval saqlaymiz — getMe interceptori uchun kerak
    setTokens(tokens)
    const { data: meResp } = await userApi.getMe()
    setAuth(tokens, meResp.data)
    return meResp.data.role
  }

  const register = async (body: RegisterRequest) => {
    const { data: regResp } = await authApi.register(body)
    const tokens = regResp.data
    setTokens(tokens)
    const { data: meResp } = await userApi.getMe()
    setAuth(tokens, meResp.data)
    return meResp.data.role
  }

  return { login, register, logout, isAuthenticated, user }
}
