import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { TopbarProvider } from '@/context/TopbarContext'
import { useTopbar } from '@/context/TopbarContext'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import styles from './AppLayout.module.css'

// App yuklanganda va window focus bo'lganda backend dan yangi profil oladi.
// Bu owner mode o'zgartirganida worker qayta login qilmasdan yangi modni olishini ta'minlaydi.
const useProfileSync = () => {
  const setUser = useAuthStore((s) => s.setUser)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) return

    const sync = () => {
      authApi.me().then((res) => {
        const profile = res.data?.data
        if (profile) setUser(profile)
      }).catch(() => { /* token muddati o'tgan bo'lsa interceptor hal qiladi */ })
    }

    sync()
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
  }, [isAuthenticated, setUser])
}

const AppLayoutInner = () => {
  const { sidebarOpen, setSidebarOpen } = useTopbar()
  useProfileSync()

  return (
    <div className={styles.shell}>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.main}>
        <Topbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

const AppLayout = () => (
  <TopbarProvider>
    <AppLayoutInner />
  </TopbarProvider>
)

export default AppLayout
