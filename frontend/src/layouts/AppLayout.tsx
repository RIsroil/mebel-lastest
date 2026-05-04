import { Outlet } from 'react-router-dom'
import { TopbarProvider } from '@/context/TopbarContext'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import styles from './AppLayout.module.css'

const AppLayout = () => (
  <TopbarProvider>
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  </TopbarProvider>
)

export default AppLayout
