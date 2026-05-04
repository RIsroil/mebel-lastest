import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/user.api'
import { useAuthStore } from '@/store/auth.store'

/** Joriy foydalanuvchi profilini serverdan olish va store ni yangilash */
export const useCurrentUser = () => {
  const { isAuthenticated, setUser } = useAuthStore()

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await userApi.getMe()
      setUser(data.data)
      return data.data
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 daqiqa cache
  })
}
