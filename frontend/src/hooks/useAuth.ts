import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/api/auth.api'
import { userApi } from '@/api/user.api'
import type { LoginRequest, RegisterRequest } from '@/types/auth.types'

/** Login, register, logout va joriy user ma'lumotlarini yuklash */
export const useAuth = () => {
  const { setAuth, logout, isAuthenticated, user } = useAuthStore()

  const login = async (body: LoginRequest) => {
    const { data } = await authApi.login(body)
    const tokens = data.data
    const { data: meResp } = await userApi.getMe()
    setAuth(tokens, meResp.data)
    return meResp.data.role
  }

  const register = async (body: RegisterRequest) => {
    const { data } = await authApi.register(body)
    const tokens = data.data
    const { data: meResp } = await userApi.getMe()
    setAuth(tokens, meResp.data)
    return meResp.data.role
  }

  return { login, register, logout, isAuthenticated, user }
}
