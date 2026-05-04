import { Outlet } from 'react-router-dom'
import { TopbarProvider } from '@/context/TopbarContext'
import { useTopbar } from '@/context/TopbarContext'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import styles from './AppLayout.module.css'

const AppLayoutInner = () => {
  const { sidebarOpen, setSidebarOpen } = useTopbar()

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
